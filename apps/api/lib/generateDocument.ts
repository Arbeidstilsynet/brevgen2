import { blankTemplate, direktoratTemplate, resolveTemplate } from "@at/document-templates";
import type { DirektoratTemplateFields, GenerateDocumentRequestOptions } from "@repo/shared-types";
import { mdToPdf } from "./core";
import { HtmlConfig, PdfConfig } from "./core/config";
import { Output } from "./core/types";

const margin = {
  top: "0.5in",
  right: "1.2in",
  bottom: "1.2in",
  left: "1.2in",
};

function getDirektoratTemplatePdfConfig(fields: DirektoratTemplateFields): Partial<PdfConfig> {
  return {
    css: direktoratTemplate.globalCss,
    pdf_options: {
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: direktoratTemplate.getFooter(fields),
      margin,
    },
  };
}

function getBlankTemplatePdfConfig(): Partial<PdfConfig> {
  return {
    css: blankTemplate.globalCss,
    pdf_options: {
      margin,
    },
  };
}

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

function getConfigWithDefaults(
  options: GenerateDocumentRequestOptions,
): Partial<PdfConfig> | (Partial<HtmlConfig> & { as_html: true }) {
  if (isDirektoratTemplate(options)) {
    return mergeConfigs(
      getDirektoratTemplatePdfConfig(options.dynamic.direktoratTemplateArgs!.fields),
      options,
    );
  } else if (isBlankTemplate(options)) {
    return mergeConfigs(getBlankTemplatePdfConfig(), options);
  } else {
    return options;
  }
}

function isDirektoratTemplate(options: GenerateDocumentRequestOptions): boolean {
  return options.dynamic.template === "direktorat";
}

function isBlankTemplate(options: GenerateDocumentRequestOptions): boolean {
  return options.dynamic.template === "blank";
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

  // Templates not yet migrated to the Template interface (direktorat, blank, custom).
  const pdfConfig = getConfigWithDefaults(options);

  if (isDirektoratTemplate(options)) {
    md = direktoratTemplate.getMd(md, options.dynamic.direktoratTemplateArgs!);
  }

  return await mdToPdf(md, pdfConfig);
}
