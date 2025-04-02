import { defaultTemplate } from "@at/document-templates";
import { DefaultTemplateFields, GenerateDocumentRequestOptions } from "@repo/shared-types";
import { mdToPdf } from "./core";
import { HtmlConfig, PdfConfig } from "./core/config";
import { Output } from "./core/types";

function getDefaultTemplatePdfConfig(fields: DefaultTemplateFields): Partial<PdfConfig> {
  return {
    css: defaultTemplate.globalCss,
    pdf_options: {
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: defaultTemplate.getFooter(fields),
      margin: {
        top: "0.5in",
        right: "1.2in",
        bottom: "1.2in",
        left: "1.2in",
      },
    },
  };
}

function getBlankTemplatePdfConfig(): Partial<PdfConfig> {
  return {
    css: defaultTemplate.globalCss,
    pdf_options: {
      margin: {
        top: "0.5in",
        right: "1.2in",
        bottom: "1.2in",
        left: "1.2in",
      },
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
  } else if (isBlankTemplate(options)) {
    return mergeConfigs(getBlankTemplatePdfConfig(), options);
  } else {
    return options;
  }
}

function isDefaultTemplate(options: GenerateDocumentRequestOptions): boolean {
  return !options.dynamic.template || options.dynamic.template === "default";
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
  }

  return await mdToPdf(md, pdfConfig);
}
