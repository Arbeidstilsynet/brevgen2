export const DEFAULT_RENDERER_STALL_THRESHOLD_MS = 75_000;
export const DEFAULT_RENDERER_RECOVERY_GRACE_MS = 75_000;

export type RendererHealthState = "healthy" | "stalled" | "unhealthy";

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
  timeSinceProgressMs: number;
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
  now?: () => number;
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
    this.now = options.now ?? (() => performance.now());
  }

  startJob(): RendererJob {
    const jobId = this.nextJobId++;
    const now = this.now();
    this.activeJobs.set(jobId, {
      startedAt: now,
      lastProgressAt: now,
    });
    this.evaluate(now);

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
        this.evaluate(job.lastProgressAt);
      },
      complete: () => {
        if (completed) {
          return;
        }
        completed = true;
        const job = this.activeJobs.get(jobId);
        if (job) {
          job.lastProgressAt = this.now();
          this.activeJobs.delete(jobId);
        }
        this.evaluate(this.now());
      },
    };
  }

  setPendingJobs(pendingJobs: number): void {
    if (!Number.isSafeInteger(pendingJobs) || pendingJobs < 0) {
      throw new TypeError("Pending renderer jobs must be a non-negative integer");
    }
    this.pendingJobs = pendingJobs;
  }

  getSnapshot(): RendererHealthSnapshot {
    return this.evaluate(this.now());
  }

  private evaluate(now: number): RendererHealthSnapshot {
    const jobs = [...this.activeJobs.values()];
    const oldestStartedAt = jobs.length === 0 ? now : Math.min(...jobs.map((job) => job.startedAt));
    const latestProgressAt =
      jobs.length === 0 ? now : Math.max(...jobs.map((job) => job.lastProgressAt));
    const activeJobStages: Partial<Record<RendererProgressStage, number>> = {};
    for (const job of jobs) {
      if (job.stage) {
        activeJobStages[job.stage] = (activeJobStages[job.stage] ?? 0) + 1;
      }
    }
    const oldestActiveJobAgeMs = Math.max(0, now - oldestStartedAt);
    const timeSinceProgressMs = Math.max(0, now - latestProgressAt);
    const atCapacity = jobs.length === this.options.maxConcurrentJobs;
    const stalledForMs = atCapacity
      ? Math.max(0, timeSinceProgressMs - this.options.stallThresholdMs)
      : 0;

    let newState: RendererHealthState = "healthy";
    if (atCapacity && timeSinceProgressMs > this.options.stallThresholdMs) {
      newState = stalledForMs > this.options.recoveryGraceMs ? "unhealthy" : "stalled";
    }

    const snapshot: RendererHealthSnapshot = {
      state: newState,
      ready: newState === "healthy",
      live: newState !== "unhealthy",
      activeJobs: jobs.length,
      pendingJobs: this.pendingJobs,
      activeJobStages,
      oldestActiveJobAgeMs,
      timeSinceProgressMs,
      stalledForMs,
    };

    if (newState !== this.state) {
      const previousState = this.state;
      this.state = newState;
      this.options.onStateChange?.({ previousState, newState, snapshot });
    }

    return snapshot;
  }
}
