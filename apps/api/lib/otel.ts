import { trace, type Attributes } from "@opentelemetry/api";

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
