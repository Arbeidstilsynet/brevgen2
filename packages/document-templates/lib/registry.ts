import {
  type DefaultTemplateArgs,
  defaultTemplateArgsSchema,
  type DocumentTemplateOption,
  type GenerateDocumentRequestOptions,
  type PdfConfig,
} from "@repo/shared-types";
import { defaultTemplate } from "./templates/default";
import type { Template } from "./template";

const margin = {
  top: "0.5in",
  right: "1.2in",
  bottom: "1.2in",
  left: "1.2in",
};

function getDefaultArgs(options: GenerateDocumentRequestOptions): DefaultTemplateArgs {
  return defaultTemplateArgsSchema.parse(options.dynamic.defaultTemplateArgs);
}

/**
 * Adapts the `default` template's building blocks (markdown assembly, footer,
 * css) to the {@link Template} interface, owning argument extraction and the
 * PDF/footer config that used to live in the API.
 */
const defaultDocumentTemplate: Template = {
  name: "default",
  argsSchema: defaultTemplateArgsSchema,

  getMd(md, options) {
    return defaultTemplate.getMd(md, getDefaultArgs(options));
  },

  getPdfConfig(options): Partial<PdfConfig> {
    const args = getDefaultArgs(options);
    return {
      css: defaultTemplate.globalCss,
      pdf_options: {
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: defaultTemplate.getFooter(args.fields),
        margin,
      },
    };
  },
};

const templates: Template[] = [defaultDocumentTemplate];

/**
 * Resolve a document template by its name. When no template is specified the
 * `default` template is used, mirroring the API's defaulting behaviour.
 *
 * Returns `undefined` for templates that have not been migrated to the
 * {@link Template} interface yet (direktorat, blank, custom).
 */
export function resolveTemplate(
  resolved: DocumentTemplateOption = "default",
): Template | undefined {
  return templates.find((template) => template.name === resolved);
}
