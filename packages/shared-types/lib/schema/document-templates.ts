import { z } from "zod";

/**
 * Pick letterhead, footer and styling template
 *
 * "default" - standard Arbeidstilsynet SOM template
 *
 * "custom" - user controlled, pass in `options.pdf_options` as needed
 *
 * "blank" - similar to custom, but retains default styling
 */
export const documentTemplateOptionSchema = z.enum(["default", "custom", "blank"]);
export type DocumentTemplateOption = z.infer<typeof documentTemplateOptionSchema>;

export const defaultTemplateLanguageSchema = z.enum(["bm", "nn"]);
export type DefaultTemplateLanguage = z.infer<typeof defaultTemplateLanguageSchema>;

export const defaultTemplateSignatureVariantSchema = z.enum([
  "elektroniskGodkjent",
  "automatiskBehandlet",
  "usignert",
]);
export type DefaultTemplateSignatureVariant = z.infer<typeof defaultTemplateSignatureVariantSchema>;

export const defaultTemplateFieldsSchema = z
  .object({
    dato: z.string(),
    saksnummer: z.union([z.string(), z.number()]), // "Vår referanse"
    tidligereReferanse: z.string().nullish(),
    deresDato: z.string().nullish(),
    deresReferanse: z.string().nullish(),
    saksbehandlerNavn: z.string(),
    erUnntattOffentlighet: z.boolean().nullish(),
    unntattOffentlighetHjemmel: z.string().nullish(),
    virksomhet: z.object({
      navn: z.string(),
      adresse: z.string(),
      postnr: z.union([z.string(), z.number()]),
      poststed: z.string(),
    }),
  })
  .refine(
    (data) => {
      if (data.erUnntattOffentlighet && !data.unntattOffentlighetHjemmel) {
        return false;
      }
      return true;
    },
    {
      message: "unntattOffentlighetHjemmel is required when erUnntattOffentlighet is true",
    },
  );
export type DefaultTemplateFields = z.infer<typeof defaultTemplateFieldsSchema>;

export const defaultTemplateArgsSchema = z.object({
  language: defaultTemplateLanguageSchema,
  signatureVariant: defaultTemplateSignatureVariantSchema,
  fields: defaultTemplateFieldsSchema,
});
export type DefaultTemplateArgs = z.infer<typeof defaultTemplateArgsSchema>;
