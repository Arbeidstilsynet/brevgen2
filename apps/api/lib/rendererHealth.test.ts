import { describe, expect, test, vi } from "vitest";
import { RendererHealth, type RendererHealthTransition } from "./rendererHealth";

function createHealth(maxConcurrentJobs = 2) {
  let now = 0;
  const transitions: RendererHealthTransition[] = [];
  const health = new RendererHealth({
    maxConcurrentJobs,
    stallThresholdMs: 100,
    recoveryGraceMs: 200,
    now: () => now,
    onStateChange: (transition) => transitions.push(transition),
  });

  return {
    health,
    transitions,
    advance: (milliseconds: number) => {
      now += milliseconds;
    },
  };
}

describe("RendererHealth", () => {
  test("keeps an idle renderer healthy regardless of time since the last completed job", () => {
    const { health, advance } = createHealth();

    advance(10_000);

    expect(health.getSnapshot()).toMatchObject({
      state: "healthy",
      ready: true,
      live: true,
      activeJobs: 0,
      timeSinceProgressMs: 0,
    });
  });

  test("stays healthy at full capacity while any active render makes progress", () => {
    const { health, advance } = createHealth();
    const first = health.startJob();
    const second = health.startJob();

    advance(90);
    first.progress("loading-content");
    advance(90);
    second.progress("producing-output");

    expect(health.getSnapshot()).toMatchObject({
      state: "healthy",
      activeJobs: 2,
      timeSinceProgressMs: 0,
    });
  });

  test("becomes unready when every slot is occupied without progress even with no pending jobs", () => {
    const { health, advance, transitions } = createHealth();
    health.startJob();
    health.startJob();

    advance(101);

    expect(health.getSnapshot()).toMatchObject({
      state: "stalled",
      ready: false,
      live: true,
      activeJobs: 2,
      pendingJobs: 0,
      activeJobStages: {},
      timeSinceProgressMs: 101,
      stalledForMs: 1,
    });
    expect(transitions).toHaveLength(1);
  });

  test("fails liveness only after the recovery grace period", () => {
    const { health, advance } = createHealth();
    health.startJob();
    health.startJob();

    advance(300);
    expect(health.getSnapshot()).toMatchObject({
      state: "stalled",
      ready: false,
      live: true,
    });

    advance(1);
    expect(health.getSnapshot()).toMatchObject({
      state: "unhealthy",
      ready: false,
      live: false,
      stalledForMs: 201,
    });
  });

  test("restores readiness when retry or recycle progress resumes", () => {
    const { health, advance, transitions } = createHealth();
    const first = health.startJob();
    health.startJob();

    advance(150);
    expect(health.getSnapshot().state).toBe("stalled");

    first.progress("retrying");

    expect(health.getSnapshot()).toMatchObject({
      state: "healthy",
      ready: true,
      live: true,
    });
    expect(transitions.map(({ newState }) => newState)).toEqual(["stalled", "healthy"]);
  });

  test("restores health when a stalled active job completes", () => {
    const { health, advance } = createHealth();
    const first = health.startJob();
    health.startJob();

    advance(301);
    expect(health.getSnapshot().state).toBe("unhealthy");

    first.complete();

    expect(health.getSnapshot()).toMatchObject({
      state: "healthy",
      ready: true,
      live: true,
      activeJobs: 1,
    });
  });

  test("emits transitions only when renderer health changes state", () => {
    const onStateChange = vi.fn<(transition: RendererHealthTransition) => void>();
    let now = 0;
    const health = new RendererHealth({
      maxConcurrentJobs: 1,
      stallThresholdMs: 100,
      recoveryGraceMs: 200,
      now: () => now,
      onStateChange,
    });
    health.startJob();

    now = 101;
    health.getSnapshot();
    health.getSnapshot();
    now = 150;
    health.getSnapshot();

    expect(onStateChange).toHaveBeenCalledOnce();
  });

  test("reports queue depth and oldest active job age", () => {
    const { health, advance } = createHealth();
    health.startJob();
    advance(50);
    health.startJob();
    health.setPendingJobs(3);
    advance(25);

    expect(health.getSnapshot()).toMatchObject({
      activeJobs: 2,
      pendingJobs: 3,
      oldestActiveJobAgeMs: 75,
      timeSinceProgressMs: 25,
    });
  });
});
