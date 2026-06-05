import type {
  DocumentTemplateOption,
  GenerateDocumentRequestOptions,
  PdfConfig,
} from "@repo/shared-types";
import type { ZodType } from "zod";

/**
 * A document template bundles everything a caller needs to render a document of
 * a given kind: the schema for its arguments, how it assembles the final
 * markdown, and the PDF config (including footer) it requires.
 *
 * Implementations own argument extraction from the request options so callers
 * never have to special-case a template by name or reach into the options.
 */
export interface Template {
  /** The name the template is registered and resolved under. */
  readonly name: DocumentTemplateOption;

  /** Schema describing the arguments this template expects. */
  readonly argsSchema: ZodType;

  /** Assemble the final markdown (letterhead, body, signature, ...). */
  getMd(md: string, options: GenerateDocumentRequestOptions): string;

  /** Build the PDF config (css, footer, margins, ...) for this template. */
  getPdfConfig(options: GenerateDocumentRequestOptions): Partial<PdfConfig>;
}
