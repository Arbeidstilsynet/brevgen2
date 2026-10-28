export const PUPPETEER_OPERATION_TIMEOUT_MS = 30_000;
export const BROWSER_CLOSE_TIMEOUT_MS = 5_000;

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
