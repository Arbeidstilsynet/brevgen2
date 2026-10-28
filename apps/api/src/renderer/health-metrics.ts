import { documentGenerationMetricNames, meter } from "../observability/otel";
import { RENDERER_HEALTH_STATES, type RendererHealth } from "./health";

const oldestActiveAge = meter.createObservableGauge(documentGenerationMetricNames.oldestActiveAge, {
  description: "Age of the oldest active document generation job",
  unit: "s",
});
const timeSinceProgress = meter.createObservableGauge(
  documentGenerationMetricNames.timeSinceProgress,
  {
    description: "Time since any active renderer job last made progress",
    unit: "s",
  },
);
const longestProgressGap = meter.createObservableGauge(
  documentGenerationMetricNames.longestProgressGap,
  {
    description: "Time since the least recently progressing active renderer job made progress",
    unit: "s",
  },
);
const stalledJobs = meter.createObservableGauge(documentGenerationMetricNames.stalledJobs, {
  description: "Active renderer jobs that have individually stopped making progress",
  unit: "{job}",
});
const rendererHealthState = meter.createObservableGauge(
  documentGenerationMetricNames.rendererHealthState,
  {
    description:
      "Current renderer health state, reported as 1 for the active state and 0 for the rest",
    unit: "1",
  },
);
const readiness = meter.createObservableGauge(documentGenerationMetricNames.readiness, {
  description: "Whether the renderer is ready to receive work",
  unit: "1",
});
const liveness = meter.createObservableGauge(documentGenerationMetricNames.liveness, {
  description: "Whether the renderer is live",
  unit: "1",
});

export function registerRendererHealthMetrics(rendererHealth: RendererHealth): void {
  // One snapshot per collection: observing each gauge separately would export series that
  // disagree with each other about the same moment in time.
  meter.addBatchObservableCallback(
    (result) => {
      const snapshot = rendererHealth.getSnapshot();
      result.observe(oldestActiveAge, snapshot.oldestActiveJobAgeMs / 1000);
      result.observe(timeSinceProgress, snapshot.timeSinceProgressMs / 1000);
      result.observe(longestProgressGap, snapshot.longestProgressGapMs / 1000);
      result.observe(stalledJobs, snapshot.stalledJobs);
      // Every state is reported so a stale series cannot be mistaken for the current one.
      for (const state of RENDERER_HEALTH_STATES) {
        result.observe(rendererHealthState, snapshot.state === state ? 1 : 0, { state });
      }
      result.observe(readiness, snapshot.ready ? 1 : 0);
      result.observe(liveness, snapshot.live ? 1 : 0);
    },
    [
      oldestActiveAge,
      timeSinceProgress,
      longestProgressGap,
      stalledJobs,
      rendererHealthState,
      readiness,
      liveness,
    ],
  );
}
