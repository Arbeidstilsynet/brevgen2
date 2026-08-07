import { logger } from "../../app";
import { withActiveSpan } from "../otel";
import { Config, defaultConfig } from "./config";
import { useBrowserWithRetry } from "./get-browser";
import { convertMdToPdf } from "./md-to-pdf";
import { InferOutputType } from "./types";
import type { RendererProgressReporter } from "../rendererHealth";
import { DOCUMENT_GENERATION_TIMEOUT_MS } from "./helpers";

/**
 * Convert a markdown file to PDF.
 */
export async function mdToPdf<T extends Partial<Config>>(
  md: string,
  config: T = {} as T,
  progress?: RendererProgressReporter,
  timeoutMs = DOCUMENT_GENERATION_TIMEOUT_MS,
): Promise<InferOutputType<T>> {
  const mergedConfig: Config = {
    ...defaultConfig,
    ...config,
    pdf_options: { ...defaultConfig.pdf_options, ...config.pdf_options },
  };
  logger.debug({ mergedConfig, path: import.meta.url, function: "mdToPdf" });

  return await withActiveSpan("browser.generate_output", async () => {
    const result = await useBrowserWithRetry(
      async (browser) => convertMdToPdf(md, mergedConfig, browser, progress),
      { progress, timeoutMs },
    );
    return result as InferOutputType<T>;
  });
}
