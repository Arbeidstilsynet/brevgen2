import { resolveTemplate } from "@at/document-templates";
import type { GenerateDocumentRequestOptions } from "@repo/shared-types";
import { mdToPdf } from "./core";
import { HtmlConfig, PdfConfig } from "./core/config";
import { Output } from "./core/types";

/**
 * Merges config objects with special handling for pdf_options to do a shallow merge
 */
function mergeConfigs(
  defaultConfig: Partial<PdfConfig | HtmlConfig>,
  userConfig: GenerateDocumentRequestOptions,
): Partial<PdfConfig | HtmlConfig> {
  const mergedConfig = { ...defaultConfig, ...userConfig };
  // Handle pdf_options specifically for a shallow merge
  if (defaultConfig.pdf_options && userConfig.pdf_options) {
    mergedConfig.pdf_options = {
      ...defaultConfig.pdf_options,
      ...userConfig.pdf_options,
    };
  }
  if (userConfig.merge_css && userConfig.css) {
    mergedConfig.css = `${defaultConfig.css ?? ""}\n${userConfig.css}`;
  }
  return mergedConfig;
}

export async function generateDocument(
  md: string,
  options: GenerateDocumentRequestOptions,
): Promise<Output> {
  const template = resolveTemplate(options.dynamic.template);
  if (template) {
    const pdfConfig = mergeConfigs(template.getPdfConfig(options), options);
    return await mdToPdf(template.getMd(md, options), pdfConfig);
  }

  // The `custom` template is not registered: the caller supplies its full config directly.
  return await mdToPdf(md, options);
}
