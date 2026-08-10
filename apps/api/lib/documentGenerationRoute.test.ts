import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { describe, expect, test } from "vitest";
import { registerDocumentGenerationRoute } from "./documentGenerationRoute";
import { GenerationCancelledError, GenerationOverloadError } from "./generationScheduler";

const requestPayload = {
  md: "# Test",
  options: {
    as_html: true,
    dynamic: {
      template: "blank" as const,
    },
  },
};

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("document generation route", () => {
  test("returns a retryable 503 response when document generation is overloaded", async () => {
    const app = Fastify();
    app.decorate("authenticate", async () => undefined);
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await registerDocumentGenerationRoute(app.withTypeProvider<ZodTypeProvider>(), async () => {
      throw new GenerationOverloadError("queue-full", 7);
    });

    const response = await app.inject({
      method: "POST",
      url: "/genererbrev",
      payload: {
        md: "# Test",
        options: {
          as_html: true,
          dynamic: {
            template: "blank",
          },
        },
      },
    });

    expect(response.statusCode).toBe(503);
    expect(response.headers["retry-after"]).toBe("7");
    expect(response.json()).toEqual({
      message: "Service unavailable",
      error: "Document generation queue is full",
    });

    await app.close();
  });

  test("does not report an unexpected 5xx when the caller disconnects while queued", async () => {
    const app = Fastify();
    app.decorate("authenticate", async () => undefined);
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    const loggedErrors: unknown[] = [];
    app.addHook("onRequest", async (request) => {
      request.log.error = (...args: unknown[]) => {
        loggedErrors.push(args);
      };
    });
    await registerDocumentGenerationRoute(app.withTypeProvider<ZodTypeProvider>(), async () => {
      throw new GenerationCancelledError();
    });

    const response = await app.inject({
      method: "POST",
      url: "/genererbrev",
      payload: {
        md: "# Test",
        options: {
          as_html: true,
          dynamic: {
            template: "blank",
          },
        },
      },
    });

    expect(response.statusCode).toBe(499);
    expect(loggedErrors).toEqual([]);

    await app.close();
  });

  test("does not cancel generation after a connected caller finishes sending its request", async () => {
    const app = Fastify();
    app.decorate("authenticate", async () => undefined);
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    const releaseGeneration = createDeferred<string>();
    await registerDocumentGenerationRoute(
      app.withTypeProvider<ZodTypeProvider>(),
      async (_request, signal) =>
        await Promise.race([
          releaseGeneration.promise,
          new Promise<string>((_resolve, reject) => {
            signal.addEventListener("abort", () => reject(new GenerationCancelledError()), {
              once: true,
            });
          }),
        ]),
    );
    const address = await app.listen({ host: "127.0.0.1", port: 0 });
    const responsePromise = fetch(`${address}/genererbrev`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requestPayload),
    });

    try {
      const earlyStatus = await Promise.race([
        responsePromise.then((response) => response.status),
        new Promise<undefined>((resolve) => setTimeout(resolve, 100)),
      ]);

      expect(earlyStatus).toBeUndefined();
      releaseGeneration.resolve("generated");
      expect((await responsePromise).status).toBe(200);
    } finally {
      releaseGeneration.resolve("generated");
      await responsePromise.catch(() => undefined);
      await app.close();
    }
  });

  test("cancels generation when the caller disconnects before receiving a response", async () => {
    const app = Fastify();
    app.decorate("authenticate", async () => undefined);
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    const generationStarted = createDeferred<void>();
    const generationCancelled = createDeferred<void>();
    await registerDocumentGenerationRoute(
      app.withTypeProvider<ZodTypeProvider>(),
      async (_request, signal) => {
        generationStarted.resolve();
        await new Promise<void>((resolve) => {
          signal.addEventListener("abort", () => resolve(), { once: true });
        });
        generationCancelled.resolve();
        throw new GenerationCancelledError();
      },
    );
    const address = await app.listen({ host: "127.0.0.1", port: 0 });
    const controller = new AbortController();
    const responsePromise = fetch(`${address}/genererbrev`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    try {
      await generationStarted.promise;
      controller.abort();
      await responsePromise.catch(() => undefined);
      await expect(
        Promise.race([
          generationCancelled.promise.then(() => true),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000)),
        ]),
      ).resolves.toBe(true);
    } finally {
      controller.abort();
      await responsePromise.catch(() => undefined);
      await app.close();
    }
  });
});
