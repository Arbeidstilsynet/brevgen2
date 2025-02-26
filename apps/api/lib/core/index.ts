import chromium from "@sparticuz/chromium";
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

type LaunchOptions = PuppeteerLaunchOptions & PuppeteerCoreLaunchOptions;

/**
 * Load all fonts for Chromium in given directory
 */
async function loadFonts(fontDir: string) {
  const fontFiles = fs.readdirSync(fontDir).filter((file) => file.endsWith(".ttf"));
  for (const fontFile of fontFiles) {
    const fontPath = path.join(fontDir, fontFile);
    console.log({ fontPath, currentDir: __dirname });
    await chromium.font(fontPath);
  }
}

async function configureChromium() {
  // Optional: If you'd like to use the new headless mode. "shell" is the default.
  // NOTE: Because we build the shell binary, this option does not work.
  //       However, this option will stay so when we migrate to full chromium it will work.
  chromium.setHeadlessMode = true;

  // Optional: If you'd like to disable webgl, true is the default.
  chromium.setGraphicsMode = false;

  // Optional: Load any fonts you need. Open Sans is included by default in AWS Lambda instances

  // Load the fonts only in AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const fontDir = path.join(__dirname, "fonts");
    await loadFonts(fontDir);
  }
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

  const lambdaArgs = {
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  } satisfies Partial<LaunchOptions>;

  const puppeteer = await loadPuppeteer();

  const browser = await puppeteer.launch({
    ...(process.env.AWS_LAMBDA_FUNCTION_NAME ? lambdaArgs : {}),
    devtools: config.devtools,
    ...config.launch_options,
  } as LaunchOptions);

  const pdf = await convertMdToPdf(md, mergedConfig, browser as PuppeteerCoreBrowser);

  await browser.close();
  await closeServer(server);

  return pdf;
}

export default mdToPdf;
