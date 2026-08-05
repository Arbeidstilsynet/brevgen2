import { afterEach, describe, expect, test, vi } from "vitest";
import { GenerationOverloadError, GenerationScheduler } from "./generationScheduler";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

afterEach(() => {
  vi.useRealTimers();
});

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
