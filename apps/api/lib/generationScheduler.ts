import { logger } from "../app";
import { DOCUMENT_GENERATION_TIMEOUT_MS, HTTP_HANDLER_TIMEOUT_MS } from "./core/helpers";
import { documentGenerationMetrics } from "./otel";
import {
  DEFAULT_RENDERER_RECOVERY_GRACE_MS,
  DEFAULT_RENDERER_STALL_THRESHOLD_MS,
  RendererHealth,
  type RendererProgressReporter,
} from "./rendererHealth";

const MAX_CONCURRENT_JOBS = 10;
const DEFAULT_MAX_PENDING_JOBS = 150;
const DEFAULT_MAX_QUEUE_WAIT_MS = 30_000;
const DEFAULT_RETRY_AFTER_SECONDS = 5;

export type GenerationOverloadReason = "queue-full" | "queue-deadline";

type QueueOutcome = "started" | "queue-deadline" | "cancelled";

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
  maxJobDurationMs?: number;
  now?: () => number;
  rendererHealth?: RendererHealth;
}

export interface GenerationTaskContext {
  progress: RendererProgressReporter;
  timeoutMs: number;
}

interface QueuedTask {
  task: (context: GenerationTaskContext) => unknown;
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
  private readonly maxJobDurationMs: number;
  readonly rendererHealth: RendererHealth;

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
    const maxJobDurationMs = options.maxJobDurationMs ?? DOCUMENT_GENERATION_TIMEOUT_MS;
    if (!Number.isSafeInteger(maxJobDurationMs) || maxJobDurationMs <= 0) {
      throw new TypeError("Generation scheduler job duration must be a positive integer");
    }
    if (maxJobDurationMs >= HTTP_HANDLER_TIMEOUT_MS) {
      throw new TypeError(
        "Generation scheduler job duration must be below the HTTP handler timeout",
      );
    }
    this.now = options.now ?? Date.now;
    this.maxJobDurationMs = maxJobDurationMs;
    this.rendererHealth =
      options.rendererHealth ??
      new RendererHealth({
        maxConcurrentJobs: options.maxConcurrentJobs,
        stallThresholdMs: DEFAULT_RENDERER_STALL_THRESHOLD_MS,
        recoveryGraceMs: DEFAULT_RENDERER_RECOVERY_GRACE_MS,
      });
  }

  schedule<T>(
    task: (context: GenerationTaskContext) => Promise<T> | T,
    signal?: AbortSignal,
  ): Promise<T> {
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
      return Promise.reject(this.overloadError("queue-full"));
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
      this.rendererHealth.setPendingJobs(this.pendingJobs.length);
      documentGenerationMetrics.pending.add(1);
      documentGenerationMetrics.admitted.add(1);
    });
  }

  private startTask<T>(task: QueuedTask): Promise<T> {
    // Once admitted, rendering is allowed to finish even if the caller disconnects.
    this.activeJobs += 1;
    const rendererJob = this.rendererHealth.startJob();
    documentGenerationMetrics.active.add(1);
    this.recordQueueWait(task, "started");

    return Promise.resolve()
      .then(() =>
        task.task({
          progress: rendererJob.progress,
          timeoutMs: this.maxJobDurationMs,
        }),
      )
      .then((result) => result as T)
      .finally(() => {
        rendererJob.complete();
        this.activeJobs -= 1;
        documentGenerationMetrics.active.add(-1);
        this.startPendingTasks();
      });
  }

  private startPendingTasks() {
    while (this.activeJobs < this.options.maxConcurrentJobs && this.pendingJobs.length > 0) {
      const queuedTask = this.pendingJobs.shift()!;
      this.rendererHealth.setPendingJobs(this.pendingJobs.length);
      documentGenerationMetrics.pending.add(-1);
      this.clearQueuedTaskResources(queuedTask);

      if (queuedTask.signal?.aborted) {
        this.rejectCancelled(queuedTask);
        continue;
      }

      if (this.now() - queuedTask.enqueuedAt >= this.options.maxQueueWaitMs) {
        this.rejectExpired(queuedTask);
        continue;
      }

      this.startTask<unknown>(queuedTask).then(queuedTask.resolve, queuedTask.reject);
    }
  }

  private expireQueuedTask(task: QueuedTask) {
    if (!this.removeQueuedTask(task)) {
      return;
    }

    this.rejectExpired(task);
  }

  private cancelQueuedTask(task: QueuedTask) {
    if (!this.removeQueuedTask(task)) {
      return;
    }

    this.rejectCancelled(task);
  }

  private overloadError(reason: GenerationOverloadReason) {
    documentGenerationMetrics.overloadRejected.add(1, { reason });
    return new GenerationOverloadError(reason, this.options.retryAfterSeconds);
  }

  private rejectExpired(task: QueuedTask) {
    this.recordQueueWait(task, "queue-deadline");
    task.reject(this.overloadError("queue-deadline"));
  }

  private rejectCancelled(task: QueuedTask) {
    this.recordQueueWait(task, "cancelled");
    documentGenerationMetrics.queuedCancelled.add(1);
    task.reject(new GenerationCancelledError());
  }

  private recordQueueWait(task: QueuedTask, outcome: QueueOutcome) {
    // Every exit from the queue is measured, so the histogram is not biased
    // towards jobs that were lucky enough to start.
    const waitedSeconds = (this.now() - task.enqueuedAt) / 1000;
    documentGenerationMetrics.queueWait.record(waitedSeconds, { outcome });
  }

  private removeQueuedTask(task: QueuedTask) {
    const index = this.pendingJobs.indexOf(task);
    if (index === -1) {
      return false;
    }

    this.pendingJobs.splice(index, 1);
    this.rendererHealth.setPendingJobs(this.pendingJobs.length);
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
  const maxConcurrentJobs = MAX_CONCURRENT_JOBS;
  const maxJobDurationMs = positiveIntegerFromEnvironment(
    "GENERATION_MAX_DURATION_MS",
    DOCUMENT_GENERATION_TIMEOUT_MS,
  );
  const rendererHealth = new RendererHealth({
    maxConcurrentJobs,
    stallThresholdMs: positiveIntegerFromEnvironment(
      "RENDERER_STALL_THRESHOLD_MS",
      DEFAULT_RENDERER_STALL_THRESHOLD_MS,
    ),
    recoveryGraceMs: positiveIntegerFromEnvironment(
      "RENDERER_RECOVERY_GRACE_MS",
      DEFAULT_RENDERER_RECOVERY_GRACE_MS,
    ),
    onStateChange: ({ previousState, newState, snapshot }) => {
      documentGenerationMetrics.rendererHealthTransitions.add(1, {
        previous_state: previousState,
        new_state: newState,
      });
      const wasReady = previousState === "healthy";
      if (wasReady !== snapshot.ready) {
        documentGenerationMetrics.readinessTransitions.add(1, {
          ready: snapshot.ready,
        });
      }
      const wasLive = previousState !== "unhealthy";
      if (wasLive !== snapshot.live) {
        documentGenerationMetrics.livenessTransitions.add(1, {
          live: snapshot.live,
        });
      }
      logger.warn(
        {
          event: "renderer.health.changed",
          previousState,
          newState,
          ...snapshot,
        },
        "Renderer health state changed",
      );
    },
  });

  return new GenerationScheduler({
    maxConcurrentJobs,
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
    maxJobDurationMs,
    rendererHealth,
  });
}
