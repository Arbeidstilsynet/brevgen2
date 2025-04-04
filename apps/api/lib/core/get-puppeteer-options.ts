import { getChromiumArgs } from "./chromium-args";
import { configureLambdaChromium } from "./lambda-config";
import { LaunchOptions } from "./types";

// conditionally import @sparticuz/chromium as it's only used in AWS Lambda
let lambdaChromium: typeof import("@sparticuz/chromium");

/**
 * Get browser launch options based on environment
 */
export async function getBrowserLaunchOptions(): Promise<LaunchOptions> {
  // Configure for AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    lambdaChromium ??= (await import("@sparticuz/chromium")).default;
    await configureLambdaChromium(lambdaChromium);
    return {
      args: lambdaChromium.args,
      defaultViewport: lambdaChromium.defaultViewport,
      executablePath: await lambdaChromium.executablePath(),
      headless: lambdaChromium.headless,
    };
  }
  // Configure for Docker with system Chromium
  // https://cri.dev/posts/2020-04-04-Full-list-of-Chromium-Puppeteer-flags/
  else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: getChromiumArgs(),
      headless: true,
    };
  }

  // Default options for local development
  return {};
}
