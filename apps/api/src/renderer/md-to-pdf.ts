import type { Browser } from "puppeteer-core";
import type { Config } from "./config";
import { generateOutput } from "./generate-output";
import { getHtml } from "./get-html";
import { InferOutputType } from "./types";
import type { RendererProgressReporter } from "./health";

/**
 * Convert markdown to pdf.
 */
export async function convertMdToPdf<T extends Config>(
  md: string,
  config: T,
  browser: Browser,
  progress?: RendererProgressReporter,
): Promise<InferOutputType<T>> {
  const html = getHtml(md, config);
  const output = await generateOutput(html, config, browser, progress);

  if (!output) {
    throw new Error(`Failed to create ${config.as_html ? "HTML" : "PDF"}.`);
  }

  return output;
}
