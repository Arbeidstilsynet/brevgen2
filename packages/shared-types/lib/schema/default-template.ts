import { z } from "zod";
import { templateLanguageSchema } from "./document-templates";

export const defaultTemplateSignatureVariantSchema = z.enum([
  "elektroniskGodkjent",
  "automatiskBehandlet",
  "usignert",
]);
export type DefaultTemplateSignatureVariant = z.infer<typeof defaultTemplateSignatureVariantSchema>;

export const defaultTemplateFieldsSchema = z
  .object({
    dato: z.string(), // "Vår dato"
    saksnummer: z.union([z.string(), z.number()]), // "Vår referanse"
    tidligereReferanse: z.string().nullish(),
    deresDato: z.string().nullish(),
    deresReferanse: z.string().nullish(),
    saksbehandlerNavn: z.string(), // "Vår saksbehandler"
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
  language: templateLanguageSchema,
  signatureVariant: defaultTemplateSignatureVariantSchema,
  fields: defaultTemplateFieldsSchema,
});
export type DefaultTemplateArgs = z.infer<typeof defaultTemplateArgsSchema>;
