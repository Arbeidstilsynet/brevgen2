import fs from "fs";
import path from "path";
import type {
  Browser as PuppeteerBrowser,
  LaunchOptions as PuppeteerLaunchOptions,
} from "puppeteer";
import type {
  Browser as PuppeteerCoreBrowser,
  LaunchOptions as PuppeteerCoreLaunchOptions,
} from "puppeteer-core";
import { logger } from "../../app";
import { Config, defaultConfig } from "./config";
import { convertMdToPdf } from "./md-to-pdf";
import { loadPuppeteer } from "./puppeteer-loader";
import { InferOutputType } from "./types";

// conditionally import @sparticuz/chromium as it's only used in AWS Lambda
let chromium: typeof import("@sparticuz/chromium");

type LaunchOptions = PuppeteerLaunchOptions & PuppeteerCoreLaunchOptions;

/**
 * Load all fonts for Chromium in given directory
 */
async function loadFonts(fontDir: string) {
  // Only run if we're in a Lambda environment
  if (!process.env.AWS_LAMBDA_FUNCTION_NAME) return;
  chromium ??= (await import("@sparticuz/chromium")).default;

  const fontFiles = fs.readdirSync(fontDir).filter((file) => file.endsWith(".ttf"));
  for (const fontFile of fontFiles) {
    const fontPath = path.join(fontDir, fontFile);
    await chromium.font(fontPath);
  }
  logger.info({ fontFiles }, "Loaded fonts");
}

async function configureChromium() {
  // Only configure Chromium in Lambda environment
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    chromium ??= (await import("@sparticuz/chromium")).default;

    // Optional: If you'd like to disable webgl, true is the default.
    chromium.setGraphicsMode = false;

    await loadFonts(path.join(__dirname, "fonts"));
  }
}

/**
 * Get browser launch options based on environment
 */
async function getBrowserLaunchOptions(): Promise<LaunchOptions> {
  // Configure for AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    chromium ??= (await import("@sparticuz/chromium")).default;
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  }
  // Configure for Docker with system Chromium
  // https://cri.dev/posts/2020-04-04-Full-list-of-Chromium-Puppeteer-flags/
  else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        "--no-sandbox",
        "--no-zygote",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-crash-reporter",
        "--disable-breakpad",
        "--disable-extensions",
        "--disable-default-apps",
        "--mute-audio",
      ],
      headless: true,
    };
  }

  // Default options for local development
  return {};
}

let browser: PuppeteerCoreBrowser | PuppeteerBrowser | null = null;

async function getBrowserInstance(): Promise<PuppeteerCoreBrowser> {
  if (!browser) {
    const options = await getBrowserLaunchOptions();
    const puppeteer = await loadPuppeteer();
    browser = await puppeteer.launch(options);
    logger.info("Browser instance created");
  }
  return browser as PuppeteerCoreBrowser;
}

/**
 * Convert a markdown file to PDF.
 */
export async function mdToPdf<T extends Partial<Config>>(
  md: string,
  config: T = {} as T,
): Promise<InferOutputType<T>> {
  const mergedConfig: Config = {
    ...defaultConfig,
    ...config,
    pdf_options: { ...defaultConfig.pdf_options, ...config.pdf_options },
  };
  logger.info({ mergedConfig, path: import.meta.url, function: "mdToPdf" });

  await configureChromium();
  const browserInstance = await getBrowserInstance();
  const result = await convertMdToPdf(md, mergedConfig, browserInstance);

  return result as InferOutputType<T>;
}
