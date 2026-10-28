/**
 * Renderer stall thresholds must stay reachable within one job's generation budget: a job that
 * runs out of budget is torn down and stops counting as active, so a threshold at or above
 * `DOCUMENT_GENERATION_TIMEOUT_MS` could never be crossed. `GenerationScheduler` enforces
 * `stallThresholdMs + recoveryGraceMs < maxJobDurationMs` at construction.
 */
export const DEFAULT_RENDERER_STALL_THRESHOLD_MS = 20_000;
export const DEFAULT_RENDERER_RECOVERY_GRACE_MS = 20_000;
export const DEFAULT_RENDERER_MONITOR_INTERVAL_MS = 5_000;

export type RendererHealthState = "healthy" | "stalled" | "unhealthy";

export const RENDERER_HEALTH_STATES: readonly RendererHealthState[] = [
  "healthy",
  "stalled",
  "unhealthy",
];

export type RendererProgressStage =
  | "acquiring-browser"
  | "creating-page"
  | "loading-content"
  | "producing-output"
  | "recycling-browser"
  | "retrying";

export type RendererProgressReporter = (stage: RendererProgressStage) => void;

export interface RendererHealthSnapshot {
  state: RendererHealthState;
  ready: boolean;
  live: boolean;
  activeJobs: number;
  pendingJobs: number;
  activeJobStages: Partial<Record<RendererProgressStage, number>>;
  oldestActiveJobAgeMs: number;
  /** Time since the *most recently* progressing active job last reported progress. */
  timeSinceProgressMs: number;
  /** Time since the *least recently* progressing active job last reported progress. */
  longestProgressGapMs: number;
  /** Active jobs that have individually made no progress within the stall threshold. */
  stalledJobs: number;
  stalledForMs: number;
}

export interface RendererHealthTransition {
  previousState: RendererHealthState;
  newState: RendererHealthState;
  snapshot: RendererHealthSnapshot;
}

export interface RendererHealthOptions {
  maxConcurrentJobs: number;
  stallThresholdMs: number;
  recoveryGraceMs: number;
  /**
   * Clock used for job ages. Any monotonic source works; it must not be mixed with wall-clock
   * timestamps from elsewhere. Defaults to `performance.now()`.
   */
  now?: () => number;
  /**
   * When set, health is re-evaluated on this interval so transitions are detected even while
   * nothing is calling `getSnapshot()`. The timer is unref-ed and stopped by `stop()`.
   */
  monitorIntervalMs?: number;
  onStateChange?: (transition: RendererHealthTransition) => void;
}

export interface RendererJob {
  progress: RendererProgressReporter;
  complete: () => void;
}

interface ActiveJob {
  startedAt: number;
  lastProgressAt: number;
  stage?: RendererProgressStage;
}

export class RendererHealth {
  private readonly activeJobs = new Map<number, ActiveJob>();
  private readonly now: () => number;
  private readonly monitorTimer?: ReturnType<typeof setInterval>;
  private nextJobId = 1;
  private pendingJobs = 0;
  private state: RendererHealthState = "healthy";

  constructor(private readonly options: RendererHealthOptions) {
    if (
      !Number.isSafeInteger(options.maxConcurrentJobs) ||
      !Number.isSafeInteger(options.stallThresholdMs) ||
      !Number.isSafeInteger(options.recoveryGraceMs) ||
      options.maxConcurrentJobs <= 0 ||
      options.stallThresholdMs <= 0 ||
      options.recoveryGraceMs <= 0
    ) {
      throw new TypeError("Renderer health limits must be positive integers");
    }
    const monitorIntervalMs = options.monitorIntervalMs;
    if (
      monitorIntervalMs !== undefined &&
      (!Number.isSafeInteger(monitorIntervalMs) || monitorIntervalMs <= 0)
    ) {
      throw new TypeError("Renderer health monitor interval must be a positive integer");
    }
    this.now = options.now ?? (() => performance.now());
    if (monitorIntervalMs !== undefined) {
      this.monitorTimer = setInterval(() => this.evaluate(), monitorIntervalMs);
      this.monitorTimer.unref?.();
    }
  }

  get stallThresholdMs(): number {
    return this.options.stallThresholdMs;
  }

  get recoveryGraceMs(): number {
    return this.options.recoveryGraceMs;
  }

  startJob(): RendererJob {
    const jobId = this.nextJobId++;
    const now = this.now();
    this.activeJobs.set(jobId, {
      startedAt: now,
      lastProgressAt: now,
    });
    this.evaluate();

    let completed = false;
    return {
      progress: (stage) => {
        if (completed) {
          return;
        }
        const job = this.activeJobs.get(jobId);
        if (!job) {
          return;
        }
        job.lastProgressAt = this.now();
        job.stage = stage;
        this.evaluate();
      },
      complete: () => {
        if (completed) {
          return;
        }
        completed = true;
        this.activeJobs.delete(jobId);
        this.evaluate();
      },
    };
  }

  setPendingJobs(pendingJobs: number): void {
    if (!Number.isSafeInteger(pendingJobs) || pendingJobs < 0) {
      throw new TypeError("Pending renderer jobs must be a non-negative integer");
    }
    this.pendingJobs = pendingJobs;
    this.evaluate();
  }

  /** Stop the background evaluation timer. Safe to call when no timer is running. */
  stop(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }
  }

  /**
   * Read current renderer health. Pure: it never advances the state machine, so probes and metric
   * callbacks can call it freely without emitting transitions as a side effect.
   */
  getSnapshot(): RendererHealthSnapshot {
    return this.computeSnapshot(this.now());
  }

  /**
   * Recompute health and emit a transition if the state changed. Driven by job lifecycle events
   * and, when configured, by the monitor interval.
   */
  private evaluate(): RendererHealthSnapshot {
    const snapshot = this.computeSnapshot(this.now());
    if (snapshot.state !== this.state) {
      const previousState = this.state;
      this.state = snapshot.state;
      this.options.onStateChange?.({ previousState, newState: snapshot.state, snapshot });
    }
    return snapshot;
  }

  private computeSnapshot(now: number): RendererHealthSnapshot {
    const jobs = [...this.activeJobs.values()];
    const oldestStartedAt = jobs.length === 0 ? now : Math.min(...jobs.map((job) => job.startedAt));
    const latestProgressAt =
      jobs.length === 0 ? now : Math.max(...jobs.map((job) => job.lastProgressAt));
    const earliestProgressAt =
      jobs.length === 0 ? now : Math.min(...jobs.map((job) => job.lastProgressAt));
    const activeJobStages: Partial<Record<RendererProgressStage, number>> = {};
    let stalledJobs = 0;
    for (const job of jobs) {
      if (job.stage) {
        activeJobStages[job.stage] = (activeJobStages[job.stage] ?? 0) + 1;
      }
      if (now - job.lastProgressAt > this.options.stallThresholdMs) {
        stalledJobs++;
      }
    }
    const oldestActiveJobAgeMs = Math.max(0, now - oldestStartedAt);
    const timeSinceProgressMs = Math.max(0, now - latestProgressAt);
    const longestProgressGapMs = Math.max(0, now - earliestProgressAt);
    // `>=` rather than `===`: the scheduler and this tracker are configured separately, and a
    // drift between the two limits must degrade the signal, not switch it off entirely.
    const atCapacity = jobs.length >= this.options.maxConcurrentJobs;
    const stalledForMs = atCapacity
      ? Math.max(0, timeSinceProgressMs - this.options.stallThresholdMs)
      : 0;

    let state: RendererHealthState = "healthy";
    if (atCapacity && timeSinceProgressMs > this.options.stallThresholdMs) {
      state = stalledForMs > this.options.recoveryGraceMs ? "unhealthy" : "stalled";
    }

    return {
      state,
      ready: state === "healthy",
      live: state !== "unhealthy",
      activeJobs: jobs.length,
      pendingJobs: this.pendingJobs,
      activeJobStages,
      oldestActiveJobAgeMs,
      timeSinceProgressMs,
      longestProgressGapMs,
      stalledJobs,
      stalledForMs,
    };
  }
}
