import type { LaunchOptions } from "puppeteer-core";
import { Viewport } from "puppeteer-core";
import { getChromiumArgs } from "./chromium-args";
import { configureLambdaChromium } from "./lambda-config";

// conditionally import @sparticuz/chromium as it's only used in AWS Lambda
let lambdaChromium: typeof import("@sparticuz/chromium").default;

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
export async function getBrowserLaunchOptions(): Promise<LaunchOptions> {
  // Configure for AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    lambdaChromium ??= (await import("@sparticuz/chromium")).default;
    configureLambdaChromium(lambdaChromium);
    return {
      args: getChromiumArgs(),
      defaultViewport: viewport,
      executablePath: await lambdaChromium.executablePath(),
      headless: "shell",
    };
  }
  // Configure for Docker with system Chromium
  // https://cri.dev/posts/2020-04-04-Full-list-of-Chromium-Puppeteer-flags/
  else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
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
