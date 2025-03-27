import { defaultTemplate, TemplateOption } from "@at/document-templates";
import { mdToPdf } from "./core";
import { HtmlConfig, PdfConfig } from "./core/config";
import { Output } from "./core/types";

interface DynamicMdPdfConfig {
  /**
   * Pick letterhead, footer and styling template
   *
   * "default" - standard Arbeidstilsynet SOM template
   *
   * "custom" - user controlled, pass in `options.pdf_options` as needed
   *
   * "blank" - similar to custom, but retains default styling
   */
  template?: TemplateOption;
  /**
   * Required if template is "default"
   */
  defaultTemplateArgs?: defaultTemplate.DefaultTemplateArgs;
}

export type GenerateDocumentOptions = Partial<PdfConfig | HtmlConfig> & {
  dynamic?: DynamicMdPdfConfig;
};

function getDefaultTemplatePdfConfig(
  fields: defaultTemplate.DefaultTemplateFields,
): Partial<PdfConfig> {
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
  userConfig: GenerateDocumentOptions,
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
  options: GenerateDocumentOptions,
): Partial<PdfConfig> | (Partial<HtmlConfig> & { as_html: true }) {
  if (isDefaultTemplate(options)) {
    return mergeConfigs(
      getDefaultTemplatePdfConfig(options.dynamic!.defaultTemplateArgs!.fields),
      options,
    );
  } else if (isBlankTemplate(options)) {
    return mergeConfigs(getBlankTemplatePdfConfig(), options);
  } else {
    return options;
  }
}

function isDefaultTemplate(options?: GenerateDocumentOptions): boolean {
  return !options?.dynamic?.template || options?.dynamic?.template === "default";
}

function isBlankTemplate(options?: GenerateDocumentOptions): boolean {
  return options?.dynamic?.template === "blank";
}

function validateOptions(options?: GenerateDocumentOptions) {
  if (!isDefaultTemplate(options)) {
    return;
  }
  if (!options?.dynamic?.defaultTemplateArgs) {
    throw new TypeError("defaultTemplateArgs are required when using the default template");
  }
  if (!options?.dynamic.defaultTemplateArgs.language) {
    throw new TypeError("defaultTemplateArgs.language is required when using the default template");
  }
  if (!options?.dynamic.defaultTemplateArgs.fields) {
    throw new TypeError("defaultTemplateArgs.fields are required when using the default template");
  }
  if (!options?.dynamic.defaultTemplateArgs.signatureVariant) {
    throw new TypeError(
      "defaultTemplateArgs.signatureVariant is required when using the default template",
    );
  }
  if (
    options?.dynamic.defaultTemplateArgs.fields.erUnntattOffentlighet &&
    !options?.dynamic.defaultTemplateArgs.fields.unntattOffentlighetHjemmel
  ) {
    throw new TypeError(
      "defaultTemplateArgs.fields.unntattOffentlighetHjemmel is required when defaultTemplateArgs.fields.erUnntattOffentlighet is true",
    );
  }
}

export async function generateDocument(
  md: string,
  options?: GenerateDocumentOptions,
): Promise<Output> {
  validateOptions(options);

  const pdfConfig = getConfigWithDefaults(options ?? {});
  console.info("api/lib generatePdf()", { pdfConfig });

  if (isDefaultTemplate(options)) {
    md = defaultTemplate.getMd(md, options!.dynamic!.defaultTemplateArgs!);
  }

  return await mdToPdf(md, pdfConfig);
}
