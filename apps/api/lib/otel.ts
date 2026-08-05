import { metrics, trace, type Attributes } from "@opentelemetry/api";

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
};
