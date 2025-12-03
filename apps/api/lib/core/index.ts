import { logger } from "../../app";
import { Config, defaultConfig } from "./config";
import { useBrowserWithRetry } from "./get-browser";
import { convertMdToPdf } from "./md-to-pdf";
import { InferOutputType } from "./types";

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
  logger.debug({ mergedConfig, path: import.meta.url, function: "mdToPdf" });

  return await useBrowserWithRetry(async (browser) => {
    const result = await convertMdToPdf(md, mergedConfig, browser);
    return result as InferOutputType<T>;
  });
}
