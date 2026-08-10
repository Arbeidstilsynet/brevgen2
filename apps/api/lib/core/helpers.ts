import type { PDFOptions } from "puppeteer-core";

export const PUPPETEER_OPERATION_TIMEOUT_MS = 30_000;
export const BROWSER_CLOSE_TIMEOUT_MS = 5_000;

/**
 * Timeout budget, from the outside in:
 *
 * - HAProxy terminates the request at 60s.
 * - `HTTP_HANDLER_TIMEOUT_MS` is the Fastify backstop below that.
 * - `DOCUMENT_GENERATION_TIMEOUT_MS` bounds everything the pod does for one request, measured
 *   from the moment it enters the generation queue. Queue wait therefore eats into the render
 *   budget instead of being added on top of it, which keeps the total below the Fastify backstop.
 */
export const DOCUMENT_GENERATION_TIMEOUT_MS = 50_000;
export const HTTP_HANDLER_TIMEOUT_MS = 55_000;

export class OperationTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`);
    this.name = "OperationTimeoutError";
  }
}

/**
 * Raised when a request runs out of its total generation budget.
 *
 * Distinct from `OperationTimeoutError` because it says nothing about the health of the Chromium
 * instance: the request may simply have arrived with very little budget left. Callers use this to
 * avoid recycling a perfectly healthy browser when they are merely out of time.
 */
export class GenerationDeadlineError extends OperationTimeoutError {
  constructor(timeoutMs: number) {
    super("Generating document", timeoutMs);
    this.name = "GenerationDeadlineError";
  }
}

export function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName: string,
  createError: (operationName: string, timeoutMs: number) => Error = (name, ms) =>
    new OperationTimeoutError(name, ms),
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(createError(operationName, timeoutMs)), timeoutMs);
  });

  return Promise.race([operation, timeoutPromise]).finally(() => {
    clearTimeout(timeout);
  });
}

/**
 * Get a margin object from a CSS-like margin string.
 */
export const getMarginObject = (margin: string): PDFOptions["margin"] => {
  if (typeof margin !== "string") {
    throw new TypeError(`margin needs to be a string.`);
  }

  const [top, right, bottom, left, ...remaining] = margin.split(" ");

  if (remaining.length > 0) {
    throw new Error(`invalid margin input "${margin}": can have max 4 values.`);
  }

  if (left) {
    return { top, right, bottom, left };
  }
  if (bottom) {
    return { top, right, bottom, left: right };
  }
  if (right) {
    return { top, right, bottom: top, left: right };
  }
  if (top) {
    return { top, right: top, bottom: top, left: top };
  }
  return undefined;
};
