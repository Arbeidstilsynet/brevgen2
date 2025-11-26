import type { LaunchOptions } from "puppeteer-core";
import { Viewport } from "puppeteer-core";
import { getChromiumArgs } from "./chromium-args";

const viewport: Viewport = {
  deviceScaleFactor: 1,
  hasTouch: false,
  height: 1080,
  isLandscape: true,
  isMobile: false,
  width: 1920,
};

/**
 * Get browser launch options based on environment
 */
export function getBrowserLaunchOptions(): LaunchOptions {
  // Configure for Docker with system Chromium
  // https://cri.dev/posts/2020-04-04-Full-list-of-Chromium-Puppeteer-flags/
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return {
      args: getChromiumArgs(),
      defaultViewport: viewport,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      headless: true,
    };
  }

  // Default options for local development
  return {};
}
