import { afterEach, describe, expect, test, vi } from "vitest";
import { RendererHealth, type RendererHealthTransition } from "./rendererHealth";

const MONITOR_INTERVAL_MS = 50;

function createHealth(maxConcurrentJobs = 2) {
  vi.useFakeTimers();
  let now = 0;
  const transitions: RendererHealthTransition[] = [];
  const health = new RendererHealth({
    maxConcurrentJobs,
    stallThresholdMs: 100,
    recoveryGraceMs: 200,
    monitorIntervalMs: MONITOR_INTERVAL_MS,
    now: () => now,
    onStateChange: (transition) => transitions.push(transition),
  });

  return {
    health,
    transitions,
    // Moves the injected clock and lets the background monitor observe the new time, which is how
    // a wedged renderer is detected in production without anything polling the snapshot.
    advance: async (milliseconds: number) => {
      now += milliseconds;
      await vi.advanceTimersByTimeAsync(milliseconds);
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("RendererHealth", () => {
  test("keeps an idle renderer healthy regardless of time since the last completed job", async () => {
    const { health, advance } = createHealth();

    await advance(10_000);

    expect(health.getSnapshot()).toMatchObject({
      state: "healthy",
      ready: true,
      live: true,
      activeJobs: 0,
      timeSinceProgressMs: 0,
    });
  });

  test("stays healthy at full capacity while any active render makes progress", async () => {
    const { health, advance } = createHealth();
    const first = health.startJob();
    const second = health.startJob();

    await advance(90);
    first.progress("loading-content");
    await advance(90);
    second.progress("producing-output");

    expect(health.getSnapshot()).toMatchObject({
      state: "healthy",
      activeJobs: 2,
      timeSinceProgressMs: 0,
    });
  });

  test("becomes unready when every slot is occupied without progress even with no pending jobs", async () => {
    const { health, advance, transitions } = createHealth();
    health.startJob();
    health.startJob();

    await advance(101);

    expect(health.getSnapshot()).toMatchObject({
      state: "stalled",
      ready: false,
      live: true,
      activeJobs: 2,
      pendingJobs: 0,
      activeJobStages: {},
      timeSinceProgressMs: 101,
      stalledJobs: 2,
      stalledForMs: 1,
    });
    expect(transitions).toHaveLength(1);
  });

  test("treats more active jobs than configured capacity as full capacity", async () => {
    const { health, advance } = createHealth(2);
    health.startJob();
    health.startJob();
    health.startJob();

    await advance(101);

    expect(health.getSnapshot()).toMatchObject({ state: "stalled", activeJobs: 3 });
  });

  test("fails liveness only after the recovery grace period", async () => {
    const { health, advance } = createHealth();
    health.startJob();
    health.startJob();

    await advance(300);
    expect(health.getSnapshot()).toMatchObject({
      state: "stalled",
      ready: false,
      live: true,
    });

    await advance(1);
    expect(health.getSnapshot()).toMatchObject({
      state: "unhealthy",
      ready: false,
      live: false,
      stalledForMs: 201,
    });
  });

  test("restores readiness when retry or recycle progress resumes", async () => {
    const { health, advance, transitions } = createHealth();
    const first = health.startJob();
    health.startJob();

    await advance(150);
    expect(health.getSnapshot().state).toBe("stalled");

    first.progress("retrying");

    expect(health.getSnapshot()).toMatchObject({
      state: "healthy",
      ready: true,
      live: true,
    });
    expect(transitions.map(({ newState }) => newState)).toEqual(["stalled", "healthy"]);
  });

  test("restores health when a stalled active job completes", async () => {
    const { health, advance } = createHealth();
    const first = health.startJob();
    health.startJob();

    await advance(301);
    expect(health.getSnapshot().state).toBe("unhealthy");

    first.complete();

    expect(health.getSnapshot()).toMatchObject({
      state: "healthy",
      ready: true,
      live: true,
      activeJobs: 1,
    });
  });

  test("reports individually stalled jobs while the renderer is still healthy overall", async () => {
    const { health, advance } = createHealth(2);
    const wedged = health.startJob();
    wedged.progress("loading-content");
    const healthy = health.startJob();

    await advance(150);
    healthy.progress("producing-output");

    expect(health.getSnapshot()).toMatchObject({
      state: "healthy",
      ready: true,
      activeJobs: 2,
      stalledJobs: 1,
      longestProgressGapMs: 150,
      timeSinceProgressMs: 0,
    });
  });

  test("emits transitions only when renderer health changes state", async () => {
    const { health, advance, transitions } = createHealth(1);
    health.startJob();

    await advance(101);
    await advance(49);

    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toMatchObject({ previousState: "healthy", newState: "stalled" });
  });

  test("reads snapshots without advancing the state machine", async () => {
    let now = 0;
    const transitions: RendererHealthTransition[] = [];
    const health = new RendererHealth({
      maxConcurrentJobs: 1,
      stallThresholdMs: 100,
      recoveryGraceMs: 200,
      now: () => now,
      onStateChange: (transition) => transitions.push(transition),
    });
    health.startJob();

    now = 101;

    // No monitor interval, so only the pure read happens here.
    expect(health.getSnapshot().state).toBe("stalled");
    expect(health.getSnapshot().state).toBe("stalled");
    expect(transitions).toHaveLength(0);
  });

  test("stops evaluating renderer health once stopped", async () => {
    const { health, advance, transitions } = createHealth(1);
    health.startJob();
    health.stop();

    await advance(101);

    expect(transitions).toHaveLength(0);
    expect(health.getSnapshot().state).toBe("stalled");
  });

  test("reports queue depth and oldest active job age", async () => {
    const { health, advance } = createHealth();
    health.startJob();
    await advance(50);
    health.startJob();
    health.setPendingJobs(3);
    await advance(25);

    expect(health.getSnapshot()).toMatchObject({
      activeJobs: 2,
      pendingJobs: 3,
      oldestActiveJobAgeMs: 75,
      timeSinceProgressMs: 25,
    });
  });
});
