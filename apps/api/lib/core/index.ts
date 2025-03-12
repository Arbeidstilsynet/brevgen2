import fs from "fs";
import getPort from "get-port";
import path from "path";
import type { LaunchOptions as PuppeteerLaunchOptions } from "puppeteer";
import type {
  Browser as PuppeteerCoreBrowser,
  LaunchOptions as PuppeteerCoreLaunchOptions,
} from "puppeteer-core";
import { Config, defaultConfig, HtmlConfig, PdfConfig } from "./config";
import { HtmlOutput, Output, PdfOutput } from "./generate-output";
import { convertMdToPdf } from "./md-to-pdf";
import { loadPuppeteer } from "./puppeteer-loader";
import { closeServer, serveDirectory } from "./serve-dir";

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
    console.log({ fontPath, currentDir: __dirname });
    await chromium.font(fontPath);
  }
}

async function configureChromium() {
  // Only configure Chromium in Lambda environment
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    chromium ??= (await import("@sparticuz/chromium")).default;

    // Optional: If you'd like to use the new headless mode. "shell" is the default.
    chromium.setHeadlessMode = true;

    // Optional: If you'd like to disable webgl, true is the default.
    chromium.setGraphicsMode = false;

    await loadFonts(path.join(__dirname, "fonts"));
  }
}

/**
 * Get browser launch options based on environment
 */
async function getBrowserLaunchOptions(): Promise<LaunchOptions> {
  // Default options for local development
  let options: LaunchOptions = {};

  // Configure for AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    chromium ??= (await import("@sparticuz/chromium")).default;
    options = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    };
  }
  // Configure for Docker with system Chromium
  else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options = {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      headless: true,
    };
  }

  return options;
}

/**
 * Convert a markdown file to PDF.
 */
export async function mdToPdf(md: string, config?: Partial<PdfConfig>): Promise<PdfOutput>;
export async function mdToPdf(md: string, config?: Partial<HtmlConfig>): Promise<HtmlOutput>;
export async function mdToPdf(md: string, config: Partial<Config> = {}): Promise<Output> {
  if (!config.port) {
    config.port = await getPort();
  }

  if (!config.basedir) {
    config.basedir = process.cwd();
  }

  const mergedConfig: Config = {
    ...defaultConfig,
    ...config,
    pdf_options: { ...defaultConfig.pdf_options, ...config.pdf_options },
  };

  if (process.env.DEBUG) {
    console.log({ function: "core/mdToPdf", mergedConfig });
  }

  const server = await serveDirectory(mergedConfig);

  await configureChromium();

  const options = await getBrowserLaunchOptions();

  const puppeteer = await loadPuppeteer();

  const browser = await puppeteer.launch({
    ...options,
    devtools: config.devtools,
    ...config.launch_options,
  } as LaunchOptions);

  const pdf = await convertMdToPdf(md, mergedConfig, browser as PuppeteerCoreBrowser);

  await browser.close();
  await closeServer(server);

  return pdf;
}

export default mdToPdf;
