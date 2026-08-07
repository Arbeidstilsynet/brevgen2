import type { PDFOptions } from "puppeteer-core";

export const PUPPETEER_OPERATION_TIMEOUT_MS = 30_000;
export const BROWSER_CLOSE_TIMEOUT_MS = 5_000;
export const DOCUMENT_GENERATION_TIMEOUT_MS = 50_000;
export const HTTP_HANDLER_TIMEOUT_MS = 55_000;

export class OperationTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`);
    this.name = "OperationTimeoutError";
  }
}

export function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName: string,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new OperationTimeoutError(operationName, timeoutMs)),
      timeoutMs,
    );
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
