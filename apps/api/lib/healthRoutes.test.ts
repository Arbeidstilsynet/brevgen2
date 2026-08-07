import Fastify from "fastify";
import { describe, expect, test, vi } from "vitest";
import { registerHealthRoutes, StartupHealthCheck } from "./healthRoutes";
import { RendererHealth } from "./rendererHealth";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("StartupHealthCheck", () => {
  test("runs one cached warm-up and succeeds only after it completes", async () => {
    const warmup = createDeferred<void>();
    const render = vi.fn<() => Promise<void>>(async () => await warmup.promise);
    const startup = new StartupHealthCheck(render);

    expect(startup.getStatus()).toBe("pending");
    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce());
    expect(startup.getStatus()).toBe("pending");

    warmup.resolve();
    await startup.result;

    expect(startup.getStatus()).toBe("succeeded");
    expect(render).toHaveBeenCalledOnce();
  });

  test("caches a failed warm-up without retrying it", async () => {
    const error = new Error("warm-up failed");
    const onFailure = vi.fn<(error: unknown) => void>();
    const render = vi.fn<() => Promise<void>>(async () => {
      throw error;
    });
    const startup = new StartupHealthCheck(render, onFailure);

    await startup.result;

    expect(startup.getStatus()).toBe("failed");
    expect(render).toHaveBeenCalledOnce();
    expect(onFailure).toHaveBeenCalledExactlyOnceWith(error);
  });
});

describe("health routes", () => {
  test("keeps the compatibility health check and reports startup state", async () => {
    const app = Fastify();
    const health = new RendererHealth({
      maxConcurrentJobs: 1,
      stallThresholdMs: 100,
      recoveryGraceMs: 200,
    });
    const warmup = createDeferred<void>();
    const startup = new StartupHealthCheck(async () => await warmup.promise);
    await registerHealthRoutes(app, health, startup);

    expect((await app.inject("/health")).statusCode).toBe(200);
    expect((await app.inject("/health/startup")).statusCode).toBe(503);

    warmup.resolve();
    await startup.result;

    expect((await app.inject("/health/startup")).statusCode).toBe(200);
    await app.close();
  });

  test("fails readiness before liveness for a stalled renderer and recovers on progress", async () => {
    let now = 0;
    const app = Fastify();
    const health = new RendererHealth({
      maxConcurrentJobs: 1,
      stallThresholdMs: 100,
      recoveryGraceMs: 200,
      now: () => now,
    });
    const startup = new StartupHealthCheck(async () => undefined);
    await startup.result;
    await registerHealthRoutes(app, health, startup);
    const job = health.startJob();

    now = 101;
    expect((await app.inject("/health/readiness")).statusCode).toBe(503);
    expect((await app.inject("/health/liveness")).statusCode).toBe(200);

    now = 301;
    expect((await app.inject("/health/liveness")).statusCode).toBe(503);

    job.progress("recycling-browser");
    expect((await app.inject("/health/readiness")).statusCode).toBe(200);
    expect((await app.inject("/health/liveness")).statusCode).toBe(200);

    job.complete();
    await app.close();
  });
});
