import type { Browser } from "puppeteer-core";
import { logger } from "../../app";
import { withActiveSpan } from "../otel";
import type { RendererProgressReporter } from "../rendererHealth";
import { getBrowserLaunchOptions } from "./get-puppeteer-options";
import {
  BROWSER_CLOSE_TIMEOUT_MS,
  DOCUMENT_GENERATION_TIMEOUT_MS,
  GenerationDeadlineError,
  PUPPETEER_OPERATION_TIMEOUT_MS,
  withTimeout,
} from "./helpers";
import { loadPuppeteer } from "./puppeteer-loader";

// After max pages is reached, we recycle the browser.
// This is needed because the Chromium instance can become unstable after many pages (100+),
// causing Puppeteer to error with `target closed`.

// failed requests are retried a limited number of times.
const MAX_RETRIES_PER_REQUEST = 2;
const monotonicNow = () => performance.now();

// WORKAROUND for instability in testcontainers, recycle after each request there.
const MAX_PAGES_PER_BROWSER = process.env.TESTCONTAINERS ? 1 : 50;

// Errors that indicate the Chromium instance / session is unstable.
// We treat ANY error as invalidating the browser (safer), but we keep this list for logging.
const KNOWN_UNSTABLE_PATTERNS = [
  "Target closed",
  "detached Frame",
  "Navigating frame was detached",
  "Requesting main frame too early",
  "Protocol error",
];

interface BrowserRetryContext {
  budget: GenerationBudget;
  maxAttempts: number;
  progress?: RendererProgressReporter;
}

type BrowserAttemptResult<T> =
  | { succeeded: true; value: T }
  | { succeeded: false; deadlineExceeded: boolean; error: unknown };

class GenerationBudget {
  private readonly deadline: number;

  constructor(
    readonly timeoutMs: number,
    private readonly now: () => number = monotonicNow,
  ) {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
      throw new TypeError("Document generation timeout must be a positive integer");
    }
    this.deadline = now() + timeoutMs;
  }

  remainingMs(): number {
    const remainingMs = this.deadline - this.now();
    if (remainingMs <= 0) {
      throw new GenerationDeadlineError(this.timeoutMs);
    }
    return Math.ceil(remainingMs);
  }

  race<T>(operation: Promise<T>): Promise<T> {
    return withTimeout(
      operation,
      this.remainingMs(),
      "Generating document",
      () => new GenerationDeadlineError(this.timeoutMs),
    );
  }
}

class BrowserPool {
  private activeUsers = 0;
  private browser: Browser | null = null;
  private browserClosePromise: Promise<void> | null = null;
  private browserInitPromise: Promise<void> | null = null;
  private pageCount = 0;
  private recycleRequested = false;

  constructor(private readonly maxPagesPerBrowser: number) {}

  async runAttempt<T>(
    fn: (browser: Browser) => Promise<T>,
    attempt: number,
    context: BrowserRetryContext,
  ): Promise<BrowserAttemptResult<T>> {
    const { budget, maxAttempts, progress } = context;
    let instance: Browser | undefined;

    try {
      progress?.("acquiring-browser");
      instance = await withActiveSpan(
        "browser.acquire",
        async () => await this.acquire(budget, progress),
        {
          "browser.acquire.attempt": attempt,
          "browser.acquire.max_attempts": maxAttempts,
          "browser.active_users": this.activeUsers,
          "browser.page_count": this.pageCount,
          "browser.recycle_requested": this.recycleRequested,
        },
      );
      // Resolve the remaining budget before calling `fn`: evaluating it as a `withTimeout`
      // argument would leave the render promise without a handler after the deadline.
      const acquiredBrowser = instance;
      const remainingMs = budget.remainingMs();
      const value = await withActiveSpan(
        "browser.render_attempt",
        async () =>
          await withTimeout(
            fn(acquiredBrowser),
            remainingMs,
            "Generating document",
            () => new GenerationDeadlineError(budget.timeoutMs),
          ),
        {
          "browser.render_attempt.attempt": attempt,
          "browser.render_attempt.max_attempts": maxAttempts,
        },
      );
      return { succeeded: true, value };
    } catch (error) {
      return {
        succeeded: false,
        deadlineExceeded: this.handleAttemptFailure(error, instance !== undefined, progress),
        error,
      };
    } finally {
      if (instance) {
        this.release();
      }
    }
  }

  private async acquire(
    budget: GenerationBudget,
    progress?: RendererProgressReporter,
  ): Promise<Browser> {
    while (true) {
      budget.remainingMs();

      if (this.browserClosePromise !== null) {
        progress?.("recycling-browser");
        await budget.race(this.browserClosePromise);
      }

      if (!this.browser) {
        this.browserInitPromise ??= this.initialize();
        await budget.race(this.browserInitPromise);
      }

      if (this.pageCount >= this.maxPagesPerBrowser || this.recycleRequested) {
        this.recycleRequested = true;
        this.recycleIfIdle();

        if (this.browserClosePromise === null) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        continue;
      }

      budget.remainingMs();
      this.activeUsers++;
      this.pageCount++;
      return this.browser!;
    }
  }

  private handleAttemptFailure(
    error: unknown,
    browserAcquired: boolean,
    progress?: RendererProgressReporter,
  ): boolean {
    const deadlineExceeded = error instanceof GenerationDeadlineError;
    if (!deadlineExceeded) {
      this.markUnhealthy(error);
      progress?.("recycling-browser");
      if (!browserAcquired) {
        this.recycleIfIdle();
      }
    }
    return deadlineExceeded;
  }

  private markUnhealthy(error: unknown): void {
    if (this.recycleRequested) {
      return;
    }

    this.recycleRequested = true;
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const matchedPattern = KNOWN_UNSTABLE_PATTERNS.find((pattern) => reason.includes(pattern));
    logger.warn(
      {
        event: "browser.mark_unhealthy",
        matchedPattern,
        reason,
        pageCount: this.pageCount,
        activeUsers: this.activeUsers,
      },
      "Marking browser as unhealthy; scheduling recycle",
    );
  }

  private release(): void {
    if (this.activeUsers > 0) {
      this.activeUsers--;
    }
    this.recycleIfIdle();
  }

  private recycleIfIdle(): void {
    if (
      this.activeUsers === 0 &&
      (this.pageCount >= this.maxPagesPerBrowser || this.recycleRequested) &&
      !this.browserClosePromise
    ) {
      this.browserClosePromise = this.recycle();
    }
  }

  private async initialize(): Promise<void> {
    try {
      const options = getBrowserLaunchOptions();
      const puppeteer = await loadPuppeteer();
      this.browser = await withTimeout(
        puppeteer.launch(options),
        PUPPETEER_OPERATION_TIMEOUT_MS,
        "Launching Chromium",
      );
      logger.info({ event: "browser.init.success" }, "Browser instance created");
    } catch (error) {
      this.browserInitPromise = null;
      logger.error({ event: "browser.init.error", error }, "Failed to initialize browser");
      throw error;
    }
  }

  private async recycle(): Promise<void> {
    try {
      logger.info(
        { event: "browser.recycle.start", pages: this.pageCount },
        `Recycling browser after ${this.pageCount} pages`,
      );

      const currentBrowser = this.browser;
      this.browser = null;
      this.browserInitPromise = null;
      this.pageCount = 0;

      if (currentBrowser) {
        try {
          await withTimeout(
            currentBrowser.close(),
            BROWSER_CLOSE_TIMEOUT_MS,
            "Closing Chromium browser",
          );
        } catch (error) {
          currentBrowser.process()?.kill("SIGKILL");
          throw error;
        }
        logger.info({ event: "browser.recycle.success" }, "Browser instance closed successfully");
      }
    } catch (error) {
      logger.error({ event: "browser.recycle.error", error }, "Error closing browser");
    } finally {
      this.browserClosePromise = null;
      this.recycleRequested = false;
    }
  }
}

const browserPool = new BrowserPool(MAX_PAGES_PER_BROWSER);

export interface BrowserRetryOptions {
  progress?: RendererProgressReporter;
  timeoutMs?: number;
}

/**
 * Execute a function with a browser instance, retrying with a fresh browser on failure.
 */
export async function useBrowserWithRetry<T>(
  fn: (browser: Browser) => Promise<T>,
  options: BrowserRetryOptions = {},
): Promise<T> {
  const context: BrowserRetryContext = {
    budget: new GenerationBudget(options.timeoutMs ?? DOCUMENT_GENERATION_TIMEOUT_MS),
    maxAttempts: MAX_RETRIES_PER_REQUEST + 1,
    progress: options.progress,
  };
  let lastError: unknown;

  for (let attempt = 1; attempt <= context.maxAttempts; attempt++) {
    if (attempt > 1) {
      context.progress?.("retrying");
    }

    const result = await browserPool.runAttempt(fn, attempt, context);
    if (result.succeeded) {
      return result.value;
    }

    lastError = result.error;
    // Running out of budget says nothing about Chromium's health. Recycling on it would make
    // every slow request under load force a recycle, which starves the requests behind it.
    if (result.deadlineExceeded || attempt === context.maxAttempts) {
      logger.error(
        {
          event: "browser.use.exhausted",
          attempt,
          maxAttempts: context.maxAttempts,
          deadlineExceeded: result.deadlineExceeded,
          error: result.error,
        },
        "Browser generation failed after retries or deadline",
      );
      break;
    }

    logger.warn(
      {
        event: "browser.use.retry",
        attempt,
        maxAttempts: context.maxAttempts,
        error: result.error,
      },
      "Retrying with new browser after failure",
    );
  }

  throw lastError;
}
