import type { PDFOptions } from "puppeteer-core";
import { z } from "zod";

// Re-export types from puppeteer for convenience
export type { PDFOptions } from "puppeteer-core";

// Accept any valid PDFOptions structure
export const pdfOptionsSchema = z
  .custom<PDFOptions>((val) => {
    return val !== null && typeof val === "object";
  })
  .optional();

export const basicConfigSchema = z.object({
  css: z.string(),
  document_title: z.string(),
  page_media_type: z.enum(["screen", "print"]),
  pdf_options: pdfOptionsSchema,
});
export type BasicConfig = z.infer<typeof basicConfigSchema>;

export const pdfConfigSchema = basicConfigSchema.extend({
  as_html: z.literal(false).optional(),
  author: z.string().optional(),
});
export type PdfConfig = z.infer<typeof pdfConfigSchema>;

export const htmlConfigSchema = basicConfigSchema.extend({
  as_html: z.literal(true),
});
export type HtmlConfig = z.infer<typeof htmlConfigSchema>;

// discriminated union is too strict with the use of partial and as_html
// export const configSchema = z.discriminatedUnion("as_html", [pdfConfigSchema, htmlConfigSchema]);
export const configSchema = z.union([pdfConfigSchema.partial(), htmlConfigSchema.partial()]);
export type Config = z.infer<typeof configSchema>;
