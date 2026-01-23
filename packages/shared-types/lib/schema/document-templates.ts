import { z } from "zod";

/**
 * Pick letterhead, footer and styling template
 *
 * "default" - standard Arbeidstilsynet SOM template
 *
 * "direktorat" - standard Arbeidstilsynet Direktorat template
 *
 * "custom" - user controlled, pass in `options.pdf_options` as needed
 *
 * "blank" - similar to custom, but retains default styling
 */
export const documentTemplateOptionSchema = z.enum(["default", "direktorat", "custom", "blank"]);
export type DocumentTemplateOption = z.infer<typeof documentTemplateOptionSchema>;

export const templateLanguageSchema = z.enum(["bm", "nn"]);
export type TemplateLanguage = z.infer<typeof templateLanguageSchema>;
