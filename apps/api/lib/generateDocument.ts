import { blankTemplate, defaultTemplate, direktoratTemplate } from "@at/document-templates";
import type {
  DefaultTemplateFields,
  DirektoratTemplateFields,
  GenerateDocumentRequestOptions,
} from "@repo/shared-types";
import { mdToPdf } from "./core";
import { HtmlConfig, PdfConfig } from "./core/config";
import { Output } from "./core/types";

const margin = {
  top: "0.5in",
  right: "1.2in",
  bottom: "1.2in",
  left: "1.2in",
};

function getDefaultTemplatePdfConfig(fields: DefaultTemplateFields): Partial<PdfConfig> {
  return {
    css: defaultTemplate.globalCss,
    pdf_options: {
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: defaultTemplate.getFooter(fields),
      margin,
    },
  };
}

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
  return mergedConfig;
}

function getConfigWithDefaults(
  options: GenerateDocumentRequestOptions,
): Partial<PdfConfig> | (Partial<HtmlConfig> & { as_html: true }) {
  if (isDefaultTemplate(options)) {
    return mergeConfigs(
      getDefaultTemplatePdfConfig(options.dynamic.defaultTemplateArgs!.fields),
      options,
    );
  } else if (isDirektoratTemplate(options)) {
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

function isDefaultTemplate(options: GenerateDocumentRequestOptions): boolean {
  return !options.dynamic.template || options.dynamic.template === "default";
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
  const pdfConfig = getConfigWithDefaults(options);

  if (isDefaultTemplate(options)) {
    md = defaultTemplate.getMd(md, options.dynamic.defaultTemplateArgs!);
  } else if (isDirektoratTemplate(options)) {
    md = direktoratTemplate.getMd(md, options.dynamic.direktoratTemplateArgs!);
  }

  return await mdToPdf(md, pdfConfig);
}
