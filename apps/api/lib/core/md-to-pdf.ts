import type { Browser } from "puppeteer-core";
import type { Config } from "./config";
import { generateOutput } from "./generate-output";
import { getHtml } from "./get-html";
import { getMarginObject } from "./helpers";
import { InferOutputType } from "./types";

/**
 * Convert markdown to pdf.
 */
export async function convertMdToPdf<T extends Config>(
  md: string,
  config: T,
  browser: Browser,
): Promise<InferOutputType<T>> {
  const { headerTemplate, footerTemplate, displayHeaderFooter } = config.pdf_options;

  if ((headerTemplate || footerTemplate) && displayHeaderFooter === undefined) {
    config.pdf_options.displayHeaderFooter = true;
  }

  // sanitize the margin in pdf_options
  if (typeof config.pdf_options.margin === "string") {
    config.pdf_options.margin = getMarginObject(config.pdf_options.margin);
  }

  const html = getHtml(md, config);
  const output = await generateOutput(html, config, browser);

  if (!output) {
    throw new Error(`Failed to create ${config.as_html ? "HTML" : "PDF"}.`);
  }

  return output;
}
