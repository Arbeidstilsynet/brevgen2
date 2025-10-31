import type { PDFOptions } from "puppeteer-core";
import { z } from "zod";

export type PDFOptionsWithLimits = Omit<PDFOptions, "path" | "timeout" | "waitForFonts">;

// PaperFormat from Puppeteer (letter, legal, a4, etc.)
const paperFormatSchema = z.enum([
  "letter",
  "legal",
  "tabloid",
  "ledger",
  "Letter",
  "Legal",
  "Tabloid",
  "Ledger",
  "LETTER",
  "LEGAL",
  "TABLOID",
  "LEDGER",
  "a0",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
  "A0",
  "A1",
  "A2",
  "A3",
  "A4",
  "A5",
  "A6",
]) satisfies z.ZodType<PDFOptions["format"]>;

// Define a comprehensive schema that matches Puppeteer's PDFOptions
const pdfOptionsBaseSchema = z.strictObject({
  scale: z.number().min(0.1).max(2),
  displayHeaderFooter: z.boolean(),
  /**
   * HTML template for the print header. Should be valid HTML with the following
   * classes used to inject values into them:
   *
   * - `date` formatted print date
   *
   * - `title` document title
   *
   * - `url` document location
   *
   * - `pageNumber` current page number
   *
   * - `totalPages` total pages in the document
   */
  headerTemplate: z.string(),
  /**
   * HTML template for the print footer. Has the same constraints and support
   * for special classes as {@link PDFOptions.headerTemplate}.
   */
  footerTemplate: z.string(),
  printBackground: z.boolean(),
  landscape: z.boolean(),
  pageRanges: z.string(),
  format: paperFormatSchema,
  width: z.union([z.string(), z.number()]),
  height: z.union([z.string(), z.number()]),
  preferCSSPageSize: z.boolean(),
  margin: z
    .object({
      top: z.union([z.string(), z.number()]),
      right: z.union([z.string(), z.number()]),
      bottom: z.union([z.string(), z.number()]),
      left: z.union([z.string(), z.number()]),
    })
    .partial(),
  omitBackground: z.boolean(),
  tagged: z.boolean(),
  outline: z.boolean(),
}) satisfies z.ZodType<PDFOptionsWithLimits>;

// Type check: ensure the schema keys match PDFOptions keys exactly
type PDFOptionsSchemaKeys = keyof z.infer<typeof pdfOptionsBaseSchema>;
type PDFOptionsKeys = keyof PDFOptionsWithLimits;

// This will show which keys are in Schema but not in PDFOptions
type ExtraKeys = Exclude<PDFOptionsSchemaKeys, PDFOptionsKeys>;
({}) satisfies Record<ExtraKeys, never>; // Error shows extra keys

// This will show which keys are in PDFOptions but not in Schema
type MissingKeys = Exclude<PDFOptionsKeys, PDFOptionsSchemaKeys>;
({}) satisfies Record<MissingKeys, never>; // Error shows missing keys

export const pdfOptionsSchema = pdfOptionsBaseSchema.partial().optional();
