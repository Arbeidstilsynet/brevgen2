import { metrics, trace, type Attributes } from "@opentelemetry/api";
import { RENDERER_HEALTH_STATES, type RendererHealth } from "./rendererHealth";

const tracer = trace.getTracer("brevgen2.api");

export async function withActiveSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Attributes,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      return await fn();
    } finally {
      span.end();
    }
  });
}

const meter = metrics.getMeter("brevgen2.api");

export const documentGenerationMetricNames = {
  generated: "brevgen.documents.generated",
  active: "brevgen.generation.active",
  pending: "brevgen.generation.pending",
  admitted: "brevgen.generation.admitted",
  overloadRejected: "brevgen.generation.overload_rejected",
  overloadResponses: "brevgen.generation.overload_responses",
  queuedCancelled: "brevgen.generation.queued_cancelled",
  queueWait: "brevgen.generation.queue_wait",
  oldestActiveAge: "brevgen.generation.oldest_active_age",
  timeSinceProgress: "brevgen.renderer.time_since_progress",
  longestProgressGap: "brevgen.renderer.longest_progress_gap",
  stalledJobs: "brevgen.renderer.stalled_jobs",
  rendererHealthState: "brevgen.renderer.health_state",
  readiness: "brevgen.renderer.readiness",
  liveness: "brevgen.renderer.liveness",
  rendererHealthTransitions: "brevgen.renderer.health_transitions",
  readinessTransitions: "brevgen.renderer.readiness_transitions",
  livenessTransitions: "brevgen.renderer.liveness_transitions",
} as const;

export const documentGenerationMetrics = {
  generated: meter.createCounter(documentGenerationMetricNames.generated, {
    description: "Total number of documents generated",
    unit: "{document}",
  }),
  active: meter.createUpDownCounter(documentGenerationMetricNames.active, {
    description: "Current number of active document generation jobs",
    unit: "{job}",
  }),
  pending: meter.createUpDownCounter(documentGenerationMetricNames.pending, {
    description: "Current number of pending document generation jobs",
    unit: "{job}",
  }),
  admitted: meter.createCounter(documentGenerationMetricNames.admitted, {
    description: "Total number of admitted document generation jobs",
    unit: "{job}",
  }),
  overloadRejected: meter.createCounter(documentGenerationMetricNames.overloadRejected, {
    description: "Total number of rejected document generation jobs",
    unit: "{job}",
  }),
  overloadResponses: meter.createCounter(documentGenerationMetricNames.overloadResponses, {
    description: "Total number of overload responses returned to consumers",
    unit: "{response}",
  }),
  queuedCancelled: meter.createCounter(documentGenerationMetricNames.queuedCancelled, {
    description: "Total number of queued document generation jobs cancelled by callers",
    unit: "{job}",
  }),
  queueWait: meter.createHistogram(documentGenerationMetricNames.queueWait, {
    description: "Time document generation jobs wait before leaving the queue",
    unit: "s",
  }),
  rendererHealthTransitions: meter.createCounter(
    documentGenerationMetricNames.rendererHealthTransitions,
    {
      description: "Total number of renderer health state transitions",
      unit: "{transition}",
    },
  ),
  readinessTransitions: meter.createCounter(documentGenerationMetricNames.readinessTransitions, {
    description: "Total number of renderer readiness state transitions",
    unit: "{transition}",
  }),
  livenessTransitions: meter.createCounter(documentGenerationMetricNames.livenessTransitions, {
    description: "Total number of renderer liveness state transitions",
    unit: "{transition}",
  }),
};

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
