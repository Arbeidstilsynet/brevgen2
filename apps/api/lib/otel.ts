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

export const documentsGenerated = meter.createCounter("brevgen.documents.generated", {
  description: "Total number of documents generated",
});

export const documentGeneration = {
  active: meter.createUpDownCounter("brevgen.document_generation.active", {
    description: "Current number of active document generation jobs",
    unit: "{job}",
  }),
  pending: meter.createUpDownCounter("brevgen.document_generation.pending", {
    description: "Current number of pending document generation jobs",
    unit: "{job}",
  }),
  admitted: meter.createCounter("brevgen.document_generation.admitted", {
    description: "Total number of admitted document generation jobs",
    unit: "{job}",
  }),
  overloadRejected: meter.createCounter("brevgen.document_generation.overload_rejected", {
    description: "Total number of rejected document generation jobs",
    unit: "{job}",
  }),
  overloadResponses: meter.createCounter("brevgen.document_generation.overload_responses", {
    description: "Total number of overload responses returned to consumers",
    unit: "{response}",
  }),
  queuedCancelled: meter.createCounter("brevgen.document_generation.queued_cancelled", {
    description: "Total number of queued document generation jobs cancelled by callers",
    unit: "{job}",
  }),
  queueWait: meter.createHistogram("brevgen.document_generation.queue_wait", {
    description: "Time document generation jobs wait before starting",
    unit: "ms",
  }),
};
