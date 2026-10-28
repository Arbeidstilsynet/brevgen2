import { resolveTemplate } from "@at/document-templates";
import type { GenerateDocumentRequestOptions } from "@repo/shared-types";
import type { PDFOptions } from "puppeteer-core";
import { type Config, defaultConfig } from "../renderer/config";
import { getMarginObject } from "./margin";

type RequestedConfig = Partial<Config> | GenerateDocumentRequestOptions;

/**
 * Resolve the complete config the renderer receives for a request.
 *
 * Precedence, lowest first: renderer defaults, the document template's config, caller options.
 * `pdf_options` are shallow-merged at each level instead of replaced. Spreads are used on purpose:
 * an explicitly `undefined` caller option overrides the levels below it.
 */
export function resolveRenderConfig(options: GenerateDocumentRequestOptions): Config {
  const template = resolveTemplate(options.dynamic.template);
  // The `custom` template is not registered: the caller supplies its full config directly.
  const requested = template
    ? applyTemplateConfig(template.getPdfConfig(options), options)
    : options;

  return {
    ...defaultConfig,
    ...requested,
    pdf_options: normalisePdfOptions({ ...defaultConfig.pdf_options, ...requested.pdf_options }),
  };
}

function applyTemplateConfig(
  templateConfig: RequestedConfig,
  options: GenerateDocumentRequestOptions,
): RequestedConfig {
  const merged = { ...templateConfig, ...options };
  if (templateConfig.pdf_options && options.pdf_options) {
    merged.pdf_options = { ...templateConfig.pdf_options, ...options.pdf_options };
  }
  if (options.merge_css && options.css) {
    merged.css = `${templateConfig.css ?? ""}\n${options.css}`;
  }
  return merged;
}

function normalisePdfOptions(pdfOptions: PDFOptions): PDFOptions {
  const normalised = { ...pdfOptions };
  const { headerTemplate, footerTemplate, displayHeaderFooter, margin } = pdfOptions;

  if ((headerTemplate || footerTemplate) && displayHeaderFooter === undefined) {
    normalised.displayHeaderFooter = true;
  }
  if (typeof margin === "string") {
    normalised.margin = getMarginObject(margin);
  }
  return normalised;
}
