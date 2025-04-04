import type { LaunchOptions as PuppeteerLaunchOptions } from "puppeteer";
import type { LaunchOptions as PuppeteerCoreLaunchOptions } from "puppeteer-core";
import type { Config } from "./config";

export type Output = PdfOutput | HtmlOutput;

interface PdfOutput {
  content: Buffer;
}

interface HtmlOutput {
  content: string;
}

export type InferOutputType<T extends Partial<Config>> = T extends { as_html: true }
  ? HtmlOutput
  : PdfOutput;

export type LaunchOptions = PuppeteerLaunchOptions & PuppeteerCoreLaunchOptions;
