import type { Browser } from "puppeteer-core";
import { logger } from "../../app";
import { getBrowserLaunchOptions } from "./get-puppeteer-options";
import { loadPuppeteer } from "./puppeteer-loader";

// After max pages is reached, we recycle the browser.
// This is needed because the Chromium instance can become unstable after many pages (100+),
// causing Puppeteer to error with `target closed`.

// failed requests are retried a limited number of times.
const MAX_RETRIES_PER_REQUEST = 2;

// WORKAROUND for instability in testcontainers, recycle after each request there.
const MAX_PAGES_PER_BROWSER = process.env.TESTCONTAINERS ? 1 : 50;

let pageCount = 0;
let activeUsers = 0;

let browser: Browser | null = null;
let browserInitPromise: Promise<void> | null = null;
let browserClosePromise: Promise<void> | null = null;

// Set when we have decided no more pages should be handed out from current browser.
let recycleRequested = false;

// Errors that indicate the Chromium instance / session is unstable.
// We treat ANY error as invalidating the browser (safer), but we keep this list for logging.
const KNOWN_UNSTABLE_PATTERNS = [
  "Target closed",
  "detached Frame",
  "Navigating frame was detached",
  "Requesting main frame too early",
  "Protocol error",
];

/**
 * Mark current browser instance as unhealthy so no new pages are handed out.
 * Will trigger recycle when possible.
 */
function markBrowserUnhealthy(err: unknown): void {
  if (recycleRequested) {
    return;
  }

  recycleRequested = true;
  const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const matchedPattern = KNOWN_UNSTABLE_PATTERNS.find((p) => reason.includes(p));
  logger.warn(
    {
      event: "browser.mark_unhealthy",
      matchedPattern,
      reason,
      pageCount,
      activeUsers,
    },
    "Marking browser as unhealthy; scheduling recycle",
  );
}

/**
 * Called when a user is done with the browser
 */
function releaseUser(): void {
  if (activeUsers > 0) {
    activeUsers--;
  }

  // If nobody is using it and we either hit the cap or a recycle was requested, recycle now.
  if (
    activeUsers === 0 &&
    (pageCount >= MAX_PAGES_PER_BROWSER || recycleRequested) &&
    !browserClosePromise
  ) {
    browserClosePromise = recycleBrowser();
  }
}

/**
 * Gets a browser instance and returns both the browser and a release function.
 * Ensures a single browser instance is never used for more than MAX_PAGES_PER_BROWSER pages.
 */
async function getBrowserInstance(): Promise<Browser> {
  // Loop until we can safely return a valid browser below page limit.
  // (Handles waits during recycle transparently.)
  while (true) {
    // If recycle in progress, wait.
    if (browserClosePromise) {
      await browserClosePromise;
    }

    // Initialize browser if needed.
    if (!browser) {
      browserInitPromise ??= initBrowser();
      await browserInitPromise;
    }

    // If page limit reached (or already requested), trigger / wait for recycle before handing out.
    if (pageCount >= MAX_PAGES_PER_BROWSER || recycleRequested) {
      recycleRequested = true;

      // If no active users, start recycle immediately (if not already started).
      if (activeUsers === 0 && !browserClosePromise) {
        browserClosePromise = recycleBrowser();
      }

      // Yield briefly to avoid tight loop.
      if (!browserClosePromise) {
        await new Promise((r) => setTimeout(r, 10));
      }
      continue;
    }

    // Safe to use current browser.
    activeUsers++;
    pageCount++;
    return browser!;
  }
}

async function initBrowser(): Promise<void> {
  try {
    const options = getBrowserLaunchOptions();
    const puppeteer = await loadPuppeteer();
    browser = await puppeteer.launch(options);
    logger.info({ event: "browser.init.success" }, "Browser instance created");
  } catch (error) {
    browserInitPromise = null;
    logger.error({ event: "browser.init.error", error }, "Failed to initialize browser");
    throw error;
  }
}

async function recycleBrowser(): Promise<void> {
  try {
    logger.info(
      { event: "browser.recycle.start", pages: pageCount },
      `Recycling browser after ${pageCount} pages`,
    );

    const currentBrowser = browser;

    // Reset state first so new requests can start initializing next browser once recycle completes.
    browser = null;
    browserInitPromise = null;
    pageCount = 0;

    if (currentBrowser) {
      await currentBrowser.close();
      logger.info({ event: "browser.recycle.success" }, "Browser instance closed successfully");
    }
  } catch (error) {
    logger.error({ event: "browser.recycle.error", error }, "Error closing browser");
  } finally {
    browserClosePromise = null;
    recycleRequested = false;
  }
}

/**
 * Execute a function with a browser instance, retrying (with fresh browser) on failure.
 *
 * - Any thrown error marks the browser as unhealthy (conservative approach).
 * - Retries a configured number of times.
 * - Each retry waits for the unhealthy browser to recycle to guarantee a new instance.
 */
export async function useBrowserWithRetry<T>(fn: (browser: Browser) => Promise<T>): Promise<T> {
  const maxAttempts = MAX_RETRIES_PER_REQUEST + 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const instance = await getBrowserInstance();
    try {
      return await fn(instance);
    } catch (error) {
      lastError = error;
      markBrowserUnhealthy(error);

      if (attempt === maxAttempts) {
        logger.error(
          {
            event: "browser.use.exhausted",
            attempt,
            maxAttempts,
            error,
          },
          "All browser retries failed",
        );
        break;
      }

      logger.warn(
        {
          event: "browser.use.retry",
          attempt,
          maxAttempts,
          error,
        },
        "Retrying with new browser after failure",
      );
    } finally {
      releaseUser();
    }
  }

  throw lastError;
}
