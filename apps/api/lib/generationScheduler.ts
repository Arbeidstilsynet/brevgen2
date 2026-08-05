import { documentGenerationMetrics } from "./otel";

const MAX_CONCURRENT_JOBS = 10;
const DEFAULT_MAX_PENDING_JOBS = 150;
const DEFAULT_MAX_QUEUE_WAIT_MS = 30_000;
const DEFAULT_RETRY_AFTER_SECONDS = 5;

export type GenerationOverloadReason = "queue-full" | "queue-deadline";

export class GenerationOverloadError extends Error {
  constructor(
    readonly reason: GenerationOverloadReason,
    readonly retryAfterSeconds: number,
  ) {
    super(
      reason === "queue-full"
        ? "Document generation queue is full"
        : "Document generation queue wait time exceeded",
    );
    this.name = "GenerationOverloadError";
  }
}

export class GenerationCancelledError extends Error {
  constructor() {
    super("Document generation request was cancelled");
    // Keeps the platform-conventional name for callers matching on `AbortError`.
    this.name = "AbortError";
  }
}

export interface GenerationSchedulerOptions {
  maxConcurrentJobs: number;
  maxPendingJobs: number;
  maxQueueWaitMs: number;
  retryAfterSeconds: number;
  now?: () => number;
}

interface QueuedTask {
  task: () => unknown;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  enqueuedAt: number;
  signal?: AbortSignal;
  abortListener?: () => void;
  deadlineTimer?: ReturnType<typeof setTimeout>;
}

function positiveIntegerFromEnvironment(name: string, defaultValue: number) {
  const rawValue = process.env[name];
  if (rawValue === undefined) {
    return defaultValue;
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive integer`);
  }
  return value;
}

export class GenerationScheduler {
  private activeJobs = 0;
  private readonly pendingJobs: QueuedTask[] = [];
  private readonly now: () => number;

  constructor(private readonly options: GenerationSchedulerOptions) {
    if (
      !Number.isSafeInteger(options.maxConcurrentJobs) ||
      !Number.isSafeInteger(options.maxPendingJobs) ||
      !Number.isSafeInteger(options.maxQueueWaitMs) ||
      !Number.isSafeInteger(options.retryAfterSeconds) ||
      options.maxConcurrentJobs <= 0 ||
      options.maxPendingJobs <= 0 ||
      options.maxQueueWaitMs <= 0 ||
      options.retryAfterSeconds <= 0
    ) {
      throw new TypeError("Generation scheduler limits must be positive integers");
    }
    this.now = options.now ?? Date.now;
  }

  schedule<T>(task: () => Promise<T> | T, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) {
      return Promise.reject(new GenerationCancelledError());
    }

    if (this.activeJobs < this.options.maxConcurrentJobs) {
      documentGenerationMetrics.admitted.add(1);
      return this.startTask<T>({
        task,
        resolve: () => undefined,
        reject: () => undefined,
        enqueuedAt: this.now(),
      });
    }

    if (this.pendingJobs.length >= this.options.maxPendingJobs) {
      const error = new GenerationOverloadError("queue-full", this.options.retryAfterSeconds);
      documentGenerationMetrics.overloadRejected.add(1, { reason: error.reason });
      return Promise.reject(error);
    }

    return new Promise<T>((resolve, reject) => {
      const queuedTask: QueuedTask = {
        task,
        resolve: (value) => resolve(value as T),
        reject,
        enqueuedAt: this.now(),
        signal,
      };
      queuedTask.abortListener = () => this.cancelQueuedTask(queuedTask);
      queuedTask.deadlineTimer = setTimeout(
        () => this.expireQueuedTask(queuedTask),
        this.options.maxQueueWaitMs,
      );
      signal?.addEventListener("abort", queuedTask.abortListener, { once: true });
      this.pendingJobs.push(queuedTask);
      documentGenerationMetrics.pending.add(1);
      documentGenerationMetrics.admitted.add(1);
    });
  }

  private startTask<T>(task: QueuedTask): Promise<T> {
    // Once admitted, rendering is allowed to finish even if the caller disconnects.
    this.activeJobs += 1;
    documentGenerationMetrics.active.add(1);
    documentGenerationMetrics.queueWait.record(this.now() - task.enqueuedAt);

    return Promise.resolve()
      .then(task.task)
      .then((result) => result as T)
      .finally(() => {
        this.activeJobs -= 1;
        documentGenerationMetrics.active.add(-1);
        this.startPendingTasks();
      });
  }

  private startPendingTasks() {
    while (this.activeJobs < this.options.maxConcurrentJobs && this.pendingJobs.length > 0) {
      const queuedTask = this.pendingJobs.shift()!;
      documentGenerationMetrics.pending.add(-1);
      this.clearQueuedTaskResources(queuedTask);

      if (queuedTask.signal?.aborted) {
        documentGenerationMetrics.queuedCancelled.add(1);
        queuedTask.reject(new GenerationCancelledError());
        continue;
      }

      if (this.now() - queuedTask.enqueuedAt >= this.options.maxQueueWaitMs) {
        const error = new GenerationOverloadError("queue-deadline", this.options.retryAfterSeconds);
        documentGenerationMetrics.overloadRejected.add(1, { reason: error.reason });
        queuedTask.reject(error);
        continue;
      }

      this.startTask<unknown>(queuedTask).then(queuedTask.resolve, queuedTask.reject);
    }
  }

  private expireQueuedTask(task: QueuedTask) {
    if (!this.removeQueuedTask(task)) {
      return;
    }

    const error = new GenerationOverloadError("queue-deadline", this.options.retryAfterSeconds);
    documentGenerationMetrics.overloadRejected.add(1, { reason: error.reason });
    task.reject(error);
  }

  private cancelQueuedTask(task: QueuedTask) {
    if (!this.removeQueuedTask(task)) {
      return;
    }

    documentGenerationMetrics.queuedCancelled.add(1);
    task.reject(new GenerationCancelledError());
  }

  private removeQueuedTask(task: QueuedTask) {
    const index = this.pendingJobs.indexOf(task);
    if (index === -1) {
      return false;
    }

    this.pendingJobs.splice(index, 1);
    documentGenerationMetrics.pending.add(-1);
    this.clearQueuedTaskResources(task);
    return true;
  }

  private clearQueuedTaskResources(task: QueuedTask) {
    // Removed queue entries must not retain timers or abort listeners.
    if (task.deadlineTimer) {
      clearTimeout(task.deadlineTimer);
    }
    if (task.abortListener) {
      task.signal?.removeEventListener("abort", task.abortListener);
    }
  }
}

export function createGenerationSchedulerFromEnvironment() {
  return new GenerationScheduler({
    maxConcurrentJobs: MAX_CONCURRENT_JOBS,
    maxPendingJobs: positiveIntegerFromEnvironment(
      "GENERATION_MAX_PENDING_JOBS",
      DEFAULT_MAX_PENDING_JOBS,
    ),
    maxQueueWaitMs: positiveIntegerFromEnvironment(
      "GENERATION_MAX_QUEUE_WAIT_MS",
      DEFAULT_MAX_QUEUE_WAIT_MS,
    ),
    retryAfterSeconds: positiveIntegerFromEnvironment(
      "GENERATION_OVERLOAD_RETRY_AFTER_SECONDS",
      DEFAULT_RETRY_AFTER_SECONDS,
    ),
  });
}
