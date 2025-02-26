import { defaultTemplate } from "@at/document-templates";
import mdToPdf from "./core";
import { PdfConfig } from "./core/config";

interface DynamicMdPdfConfig {
  /**
   * Pick letterhead, footer and styling template
   *
   * "default" - standard Arbeidstilsynet SOM template
   * "custom" - user controlled, pass in `options.pdf_options` with header/footerTemplate
   */
  template?: "default" | "custom";
  /**
   * Required if template is "default"
   */
  defaultTemplateArgs?: defaultTemplate.DefaultTemplateArgs;
}

export type GeneratePdfOptions = Partial<PdfConfig> & {
  dynamic?: DynamicMdPdfConfig;
};

export function getDefaultTemplatePdfConfig(
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

function getPdfConfigWithDefaults(options: GeneratePdfOptions): Partial<PdfConfig> {
  if (!isDefaultTemplate(options)) return options;

  const defaultConfig = getDefaultTemplatePdfConfig(options.dynamic!.defaultTemplateArgs!.fields);

  return { ...defaultConfig, ...options };
}

function isDefaultTemplate(options?: GeneratePdfOptions): boolean {
  return !options?.dynamic?.template || options?.dynamic?.template === "default";
}

function validateOptions(options?: GeneratePdfOptions) {
  if (isDefaultTemplate(options)) {
    if (!options?.dynamic?.defaultTemplateArgs) {
      throw new TypeError("defaultTemplateArgs are required when using the default template");
    }
    if (!options?.dynamic.defaultTemplateArgs.language) {
      throw new TypeError(
        "defaultTemplateArgs.language is required when using the default template",
      );
    }
    if (!options?.dynamic.defaultTemplateArgs.fields) {
      throw new TypeError(
        "defaultTemplateArgs.fields are required when using the default template",
      );
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
}

export async function generatePdf(md: string, options?: GeneratePdfOptions) {
  validateOptions(options);

  const pdfConfig = getPdfConfigWithDefaults(options ?? {});

  if (isDefaultTemplate(options)) {
    md = defaultTemplate.getMd(md, options!.dynamic!.defaultTemplateArgs!);
  }

  if (process.env.DEBUG) {
    console.log({ function: "generatePdf", options, pdfConfig });
  }

  return await mdToPdf(md, pdfConfig);
}
