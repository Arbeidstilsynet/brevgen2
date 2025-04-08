import type { Browser as PuppeteerBrowser } from "puppeteer";
import type { Browser as PuppeteerCoreBrowser } from "puppeteer-core";
import { logger } from "../../app";
import { getBrowserLaunchOptions } from "./get-puppeteer-options";
import { loadPuppeteer } from "./puppeteer-loader";

// After max pages is reached, we try to close the browser as soon as the last page using it is done.
// On the next request, a new browser will be created.
// WORKAROUND for instability in testcontainers, recycle after each request
export const MAX_PAGES_PER_BROWSER = process.env.TESTCONTAINERS ? 1 : 50;

let pageCount = 0;
let activeUsers = 0;

let browser: PuppeteerCoreBrowser | PuppeteerBrowser | null = null;
let browserInitPromise: Promise<void> | null = null;
let browserClosePromise: Promise<void> | null = null;

/**
 * Called when a user is done with the browser
 */
function releaseUser(): void {
  if (activeUsers > 0) {
    activeUsers--;
  }

  // Check if we need to recycle and no active users
  if (browser && pageCount >= MAX_PAGES_PER_BROWSER && activeUsers === 0 && !browserClosePromise) {
    // Schedule recycling now that it's safe
    browserClosePromise = recycleBrowser();
  }
}

/**
 * Gets a browser instance and returns both the browser and a release function
 */
export async function getBrowserInstance(): Promise<[PuppeteerCoreBrowser, () => void]> {
  // If recycling is in progress, wait for it
  if (browserClosePromise) {
    await browserClosePromise;
  }

  // Initialize browser if needed
  if (!browser) {
    // Make sure only one initialization happens at a time
    browserInitPromise ??= initBrowser();
    await browserInitPromise;
  }

  activeUsers++;
  pageCount++;
  return [browser as PuppeteerCoreBrowser, releaseUser];
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

    // Store reference to avoid race conditions
    const currentBrowser = browser;

    // Reset globals first to allow fresh browser creation
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
  }
}
