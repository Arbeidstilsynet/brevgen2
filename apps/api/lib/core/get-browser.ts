import type { Browser as PuppeteerBrowser } from "puppeteer";
import type { Browser as PuppeteerCoreBrowser } from "puppeteer-core";
import { logger } from "../../app";
import { getBrowserLaunchOptions } from "./get-puppeteer-options";
import { loadPuppeteer } from "./puppeteer-loader";

// After max pages is reached, we recycle the browser.
// This is needed because the Chromium instance can becomes unstable after many pages (100+),
// causing Puppeteer to error with `target closed`.

// WORKAROUND for instability in testcontainers, recycle after each request there.
const MAX_PAGES_PER_BROWSER = process.env.TESTCONTAINERS ? 1 : 50;

let pageCount = 0;
let activeUsers = 0;

let browser: PuppeteerCoreBrowser | PuppeteerBrowser | null = null;
let browserInitPromise: Promise<void> | null = null;
let browserClosePromise: Promise<void> | null = null;

// Set when we have decided no more pages should be handed out from current browser.
let recycleRequested = false;

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
export async function getBrowserInstance(): Promise<[PuppeteerCoreBrowser, () => void]> {
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

      // If we cannot start recycle yet (others still using the browser),
      // yield briefly to avoid a tight CPU loop.
      if (!browserClosePromise) {
        await new Promise((r) => setTimeout(r, 5));
      }
      continue;
    }

    // Safe to use current browser.
    activeUsers++;
    pageCount++;
    return [browser as PuppeteerCoreBrowser, releaseUser];
  }
}

async function initBrowser(): Promise<void> {
  try {
    const options = await getBrowserLaunchOptions();
    const puppeteer = await loadPuppeteer();
    browser = await puppeteer.launch(options);
    logger.info("Browser instance created");
  } catch (error) {
    browserInitPromise = null;
    logger.error(error, "Failed to initialize browser");
    throw error;
  }
}

async function recycleBrowser(): Promise<void> {
  try {
    logger.info(`Recycling browser after ${pageCount} pages`);

    const currentBrowser = browser;

    // Reset state first so new requests can start initializing next browser once recycle completes.
    browser = null;
    browserInitPromise = null;
    pageCount = 0;

    if (currentBrowser) {
      await currentBrowser.close();
      logger.info("Browser instance closed successfully");
    }
  } catch (error) {
    logger.error(error, "Error closing browser");
  } finally {
    browserClosePromise = null;
    recycleRequested = false;
  }
}
