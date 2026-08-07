import { afterEach, describe, expect, test, vi } from "vitest";
import {
  createGenerationSchedulerFromEnvironment,
  GenerationOverloadError,
  GenerationScheduler,
} from "./generationScheduler";
import { documentGenerationMetrics } from "./otel";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// The queue wait histogram is the only histogram instrument, so it can be
// observed directly without a metrics SDK.
function spyOnQueueWait() {
  return vi.spyOn(documentGenerationMetrics.queueWait, "record");
}

function createScheduler() {
  return new GenerationScheduler({
    maxConcurrentJobs: 1,
    maxPendingJobs: 1,
    maxQueueWaitMs: 100,
    retryAfterSeconds: 5,
  });
}

describe("GenerationScheduler", () => {
  test("runs no more than the configured number of generation tasks concurrently", async () => {
    const scheduler = new GenerationScheduler({
      maxConcurrentJobs: 1,
      maxPendingJobs: 1,
      maxQueueWaitMs: 100,
      retryAfterSeconds: 5,
    });
    const first = createDeferred<string>();
    const second = createDeferred<string>();
    const started: string[] = [];

    const firstResult = scheduler.schedule(async () => {
      started.push("first");
      return await first.promise;
    });
    const secondResult = scheduler.schedule(async () => {
      started.push("second");
      return await second.promise;
    });

    await vi.waitFor(() => expect(started).toEqual(["first"]));

    first.resolve("first result");
    await expect(firstResult).resolves.toBe("first result");
    await vi.waitFor(() => expect(started).toEqual(["first", "second"]));

    second.resolve("second result");
    await expect(secondResult).resolves.toBe("second result");
  });

  test("admits two active and two pending tasks before rejecting additional work", async () => {
    const scheduler = new GenerationScheduler({
      maxConcurrentJobs: 2,
      maxPendingJobs: 2,
      maxQueueWaitMs: 100,
      retryAfterSeconds: 5,
    });
    const tasks = Array.from({ length: 4 }, () => createDeferred<string>());
    const started: number[] = [];
    const results = tasks.map((task, index) =>
      scheduler.schedule(async () => {
        started.push(index);
        return await task.promise;
      }),
    );

    await vi.waitFor(() => expect(started).toEqual([0, 1]));
    await expect(scheduler.schedule(async () => undefined)).rejects.toEqual(
      new GenerationOverloadError("queue-full", 5),
    );

    tasks[0].resolve("first result");
    await expect(results[0]).resolves.toBe("first result");
    await vi.waitFor(() => expect(started).toEqual([0, 1, 2]));

    tasks[1].resolve("second result");
    await expect(results[1]).resolves.toBe("second result");
    await vi.waitFor(() => expect(started).toEqual([0, 1, 2, 3]));

    tasks[2].resolve("third result");
    tasks[3].resolve("fourth result");
    await expect(Promise.all(results.slice(2))).resolves.toEqual(["third result", "fourth result"]);
  });

  test("rejects a task immediately when the pending queue is full", async () => {
    const scheduler = new GenerationScheduler({
      maxConcurrentJobs: 1,
      maxPendingJobs: 1,
      maxQueueWaitMs: 100,
      retryAfterSeconds: 5,
    });
    const active = createDeferred<void>();
    const cancelled = new AbortController();
    let overflowTaskStarted = false;

    const activeResult = scheduler.schedule(async () => await active.promise);
    const queuedResult = scheduler.schedule(async () => undefined, cancelled.signal);

    await expect(
      scheduler.schedule(async () => {
        overflowTaskStarted = true;
      }),
    ).rejects.toEqual(new GenerationOverloadError("queue-full", 5));
    expect(overflowTaskStarted).toBe(false);

    cancelled.abort();
    await expect(queuedResult).rejects.toMatchObject({ name: "AbortError" });
    active.resolve();
    await expect(activeResult).resolves.toBeUndefined();
  });

  test("rejects a queued task that exceeds its queue deadline without running it", async () => {
    vi.useFakeTimers();
    const scheduler = new GenerationScheduler({
      maxConcurrentJobs: 1,
      maxPendingJobs: 1,
      maxQueueWaitMs: 100,
      retryAfterSeconds: 5,
    });
    const active = createDeferred<void>();
    const replacement = createDeferred<string>();
    let queuedTaskStarted = false;

    const activeResult = scheduler.schedule(async () => await active.promise);
    const queuedResult = scheduler.schedule(async () => {
      queuedTaskStarted = true;
    });
    const queuedError = queuedResult.catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(100);

    await expect(queuedError).resolves.toEqual(new GenerationOverloadError("queue-deadline", 5));
    await vi.waitFor(() => expect(queuedTaskStarted).toBe(false));

    const replacementResult = scheduler.schedule(async () => await replacement.promise);
    active.resolve();
    await expect(activeResult).resolves.toBeUndefined();

    replacement.resolve("replacement result");
    await expect(replacementResult).resolves.toBe("replacement result");
  });

  test("skips a queued task after its caller disconnects and admits replacement work", async () => {
    const scheduler = new GenerationScheduler({
      maxConcurrentJobs: 1,
      maxPendingJobs: 1,
      maxQueueWaitMs: 100,
      retryAfterSeconds: 5,
    });
    const active = createDeferred<void>();
    const replacement = createDeferred<string>();
    const disconnected = new AbortController();
    let cancelledTaskStarted = false;

    const activeResult = scheduler.schedule(async () => await active.promise);
    const cancelledResult = scheduler.schedule(async () => {
      cancelledTaskStarted = true;
    }, disconnected.signal);
    disconnected.abort();
    await expect(cancelledResult).rejects.toMatchObject({ name: "AbortError" });

    const replacementResult = scheduler.schedule(async () => await replacement.promise);
    active.resolve();
    await expect(activeResult).resolves.toBeUndefined();
    expect(cancelledTaskStarted).toBe(false);

    replacement.resolve("replacement result");
    await expect(replacementResult).resolves.toBe("replacement result");
  });

  test("allows an active document generation task to finish after its caller disconnects", async () => {
    const scheduler = new GenerationScheduler({
      maxConcurrentJobs: 1,
      maxPendingJobs: 1,
      maxQueueWaitMs: 100,
      retryAfterSeconds: 5,
    });
    const result = createDeferred<string>();
    const disconnected = new AbortController();
    let taskStarted = false;

    const scheduledResult = scheduler.schedule(async () => {
      taskStarted = true;
      return await result.promise;
    }, disconnected.signal);
    await vi.waitFor(() => expect(taskStarted).toBe(true));
    disconnected.abort();
    result.resolve("generated document");

    await expect(scheduledResult).resolves.toBe("generated document");
  });
});

describe("queue wait metric", () => {
  test("records the wait of a job that starts", async () => {
    const queueWait = spyOnQueueWait();
    const scheduler = createScheduler();
    const active = createDeferred<void>();

    const result = scheduler.schedule(async () => await active.promise);
    active.resolve();
    await result;

    expect(queueWait).toHaveBeenCalledExactlyOnceWith(expect.any(Number), { outcome: "started" });
  });

  test("records the wait of a job rejected at its queue deadline", async () => {
    vi.useFakeTimers();
    const queueWait = spyOnQueueWait();
    const scheduler = createScheduler();
    const active = createDeferred<void>();

    const activeResult = scheduler.schedule(async () => await active.promise);
    const queuedError = scheduler.schedule(async () => undefined).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(100);
    await expect(queuedError).resolves.toBeInstanceOf(GenerationOverloadError);

    expect(queueWait).toHaveBeenCalledWith(0.1, { outcome: "queue-deadline" });

    active.resolve();
    await activeResult;
  });

  test("records the wait of a job cancelled by a disconnecting caller", async () => {
    const queueWait = spyOnQueueWait();
    const scheduler = createScheduler();
    const active = createDeferred<void>();
    const disconnected = new AbortController();

    const activeResult = scheduler.schedule(async () => await active.promise);
    const cancelledResult = scheduler.schedule(async () => undefined, disconnected.signal);
    disconnected.abort();
    await expect(cancelledResult).rejects.toMatchObject({ name: "AbortError" });

    expect(queueWait).toHaveBeenCalledWith(expect.any(Number), { outcome: "cancelled" });

    active.resolve();
    await activeResult;
  });
});

describe("createGenerationSchedulerFromEnvironment", () => {
  const environmentVariables = [
    "GENERATION_MAX_PENDING_JOBS",
    "GENERATION_MAX_QUEUE_WAIT_MS",
    "GENERATION_OVERLOAD_RETRY_AFTER_SECONDS",
    "GENERATION_MAX_DURATION_MS",
    "RENDERER_STALL_THRESHOLD_MS",
    "RENDERER_RECOVERY_GRACE_MS",
  ] as const;

  afterEach(() => {
    for (const name of environmentVariables) {
      delete process.env[name];
    }
  });

  test("applies the documented default limits", async () => {
    vi.useFakeTimers();
    for (const name of environmentVariables) {
      delete process.env[name];
    }
    const scheduler = createGenerationSchedulerFromEnvironment();
    const blocked = createDeferred<void>();
    const started: number[] = [];

    // 10 active slots plus 150 pending jobs are admitted by default.
    const results = Array.from({ length: 160 }, (_unused, index) =>
      scheduler
        .schedule(async () => {
          started.push(index);
          await blocked.promise;
        })
        .catch((error: unknown) => error),
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(started).toHaveLength(10);

    const overflow = await scheduler
      .schedule(async () => undefined)
      .catch((error: unknown) => error);
    expect(overflow).toEqual(new GenerationOverloadError("queue-full", 5));

    // The default queue deadline is 30 seconds.
    await vi.advanceTimersByTimeAsync(29_999);
    expect(started).toHaveLength(10);
    await vi.advanceTimersByTimeAsync(1);

    const queuedOutcomes = await Promise.all(results.slice(10));
    expect(queuedOutcomes).toHaveLength(150);
    for (const outcome of queuedOutcomes) {
      expect(outcome).toEqual(new GenerationOverloadError("queue-deadline", 5));
    }
    expect(started).toHaveLength(10);

    blocked.resolve();
    await Promise.all(results.slice(0, 10));
  });

  test("reads limits from the environment", async () => {
    process.env.GENERATION_MAX_PENDING_JOBS = "1";
    process.env.GENERATION_OVERLOAD_RETRY_AFTER_SECONDS = "11";
    process.env.GENERATION_MAX_DURATION_MS = "1234";
    const scheduler = createGenerationSchedulerFromEnvironment();
    const blocked = createDeferred<void>();
    let receivedTimeoutMs: number | undefined;

    const results = Array.from({ length: 11 }, () =>
      scheduler
        .schedule(async ({ timeoutMs }) => {
          receivedTimeoutMs = timeoutMs;
          return await blocked.promise;
        })
        .catch((error: unknown) => error),
    );
    await vi.waitFor(() => expect(receivedTimeoutMs).toBe(1234));

    await expect(scheduler.schedule(async () => undefined)).rejects.toEqual(
      new GenerationOverloadError("queue-full", 11),
    );

    blocked.resolve();
    await Promise.all(results);
  });

  test("reads renderer health timings from the environment", async () => {
    vi.useFakeTimers();
    process.env.RENDERER_STALL_THRESHOLD_MS = "100";
    process.env.RENDERER_RECOVERY_GRACE_MS = "200";
    const scheduler = createGenerationSchedulerFromEnvironment();
    const blocked = createDeferred<void>();
    const results = Array.from({ length: 10 }, () =>
      scheduler.schedule(async () => await blocked.promise),
    );

    await vi.advanceTimersByTimeAsync(101);
    expect(scheduler.rendererHealth.getSnapshot().state).toBe("stalled");
    await vi.advanceTimersByTimeAsync(200);
    expect(scheduler.rendererHealth.getSnapshot().state).toBe("unhealthy");

    blocked.resolve();
    await Promise.all(results);
  });

  test("rejects a limit that is not a positive integer", () => {
    process.env.GENERATION_MAX_QUEUE_WAIT_MS = "0";
    expect(() => createGenerationSchedulerFromEnvironment()).toThrow(TypeError);

    process.env.GENERATION_MAX_QUEUE_WAIT_MS = "not-a-number";
    expect(() => createGenerationSchedulerFromEnvironment()).toThrow(TypeError);
  });

  test("rejects a job duration that could exceed the HTTP handler timeout", () => {
    process.env.GENERATION_MAX_DURATION_MS = "55000";
    expect(() => createGenerationSchedulerFromEnvironment()).toThrow(
      "Generation scheduler job duration must be below the HTTP handler timeout",
    );
  });
});
