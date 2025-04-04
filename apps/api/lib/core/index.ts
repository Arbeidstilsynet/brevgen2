import { logger } from "../../app";
import { Config, defaultConfig } from "./config";
import { getBrowserInstance } from "./get-browser";
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
  logger.info({ mergedConfig, path: import.meta.url, function: "mdToPdf" });

  const [browserInstance, release] = await getBrowserInstance();

  try {
    const result = await convertMdToPdf(md, mergedConfig, browserInstance);
    return result as InferOutputType<T>;
  } finally {
    release();
  }
}
