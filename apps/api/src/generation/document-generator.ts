import { resolveTemplate } from "@at/document-templates";
import { parseDynamicMd } from "@at/dynamic-markdown";
import type { GenerateDocumentRequest } from "@repo/shared-types";
import type { Config } from "../renderer/config";
import type { RendererProgressReporter } from "../renderer/health";
import type { Output } from "../renderer/types";
import { resolveRenderConfig } from "./render-config";
import type { GenerationScheduler } from "./scheduler";

export type Render = (
  md: string,
  config: Config,
  progress: RendererProgressReporter | undefined,
  timeoutMs: number,
) => Promise<Output>;

export interface DocumentGenerator {
  /**
   * Expand Dynamic Markdown, apply the document template and render within the scheduler's
   * concurrency and time budget.
   */
  generate(request: GenerateDocumentRequest, signal: AbortSignal): Promise<Output>;
}

export function createDocumentGenerator({
  scheduler,
  render,
}: {
  scheduler: GenerationScheduler;
  render: Render;
}): DocumentGenerator {
  return {
    async generate({ md, mdVariables, options }, signal) {
      const expandedMd = parseDynamicMd(md, { variables: mdVariables ?? {} });

      return await scheduler.schedule(({ progress, timeoutMs }) => {
        const config = resolveRenderConfig(options);
        const template = resolveTemplate(options.dynamic.template);
        const documentMd = template ? template.getMd(expandedMd, options) : expandedMd;
        return render(documentMd, config, progress, timeoutMs);
      }, signal);
    },
  };
}
