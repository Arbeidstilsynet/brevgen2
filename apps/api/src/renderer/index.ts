import { logger } from "../observability/logger";
import { withActiveSpan } from "../observability/otel";
import type { Config } from "./config";
import { useBrowserWithRetry } from "./browser/get-browser";
import { convertMdToPdf } from "./md-to-pdf";
import { InferOutputType } from "./types";
import type { RendererProgressReporter } from "./health";

/**
 * Render markdown to PDF or HTML. `config` must be fully resolved; the renderer does not merge
 * defaults or normalise options.
 */
export async function mdToPdf<T extends Config>(
  md: string,
  config: T,
  progress: RendererProgressReporter | undefined,
  timeoutMs: number,
): Promise<InferOutputType<T>> {
  logger.debug({ mergedConfig: config, path: import.meta.url, function: "mdToPdf" });

  return await withActiveSpan("browser.generate_output", async () => {
    return await useBrowserWithRetry(
      async (browser) => convertMdToPdf(md, config, browser, progress),
      { progress, timeoutMs },
    );
  });
}
