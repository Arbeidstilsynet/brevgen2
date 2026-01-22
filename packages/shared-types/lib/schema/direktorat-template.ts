import { z } from "zod";
import { templateLanguageSchema } from "./document-templates";

export const direktoratTemplateSignatureVariantSchema = z.enum(["usignert", "elektroniskGodkjent"]);
export type DirektoratTemplateSignatureVariant = z.infer<
  typeof direktoratTemplateSignatureVariantSchema
>;

export const direktoratTemplateFieldsSchema = z.object({
  dato: z.string().nullish(), // "Vår dato"
  saksnummer: z.union([z.string(), z.number()]).nullish(), // "Vår referanse"
  saksbehandlerNavn: z.string().nullish(), // "Vår saksbehandler"
  mottaker: z
    .object({
      navn: z.string(),
      adresse: z.string(),
      postnr: z.union([z.string(), z.number()]),
      poststed: z.string(),
    })
    .nullish(),
});
export type DirektoratTemplateFields = z.infer<typeof direktoratTemplateFieldsSchema>;

export const direktoratTemplateArgsSchema = z.object({
  language: templateLanguageSchema,
  signatureVariant: direktoratTemplateSignatureVariantSchema,
  // Enkel, valgfri liste med fritekstlinjer for signatur(er) i format navn+tittel eller annet
  // Dette brukes kun når variant "elektroniskGodkjent" er valgt
  signatureLines: z.array(z.string()).nullish(),
  fields: direktoratTemplateFieldsSchema,
});
export type DirektoratTemplateArgs = z.infer<typeof direktoratTemplateArgsSchema>;
