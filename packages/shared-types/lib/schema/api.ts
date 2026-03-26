import { z } from "zod";
import { configSchema } from "./api-core";
import { defaultTemplateArgsSchema } from "./default-template";
import { direktoratTemplateArgsSchema } from "./direktorat-template";
import { documentTemplateOptionSchema } from "./document-templates";
import { mdVariablesSchema } from "./dynamic-markdown";

export const dynamicMdPdfConfigSchema = z
  .object({
    /** See {@link documentTemplateOptionSchema} */
    template: documentTemplateOptionSchema.optional(),
    defaultTemplateArgs: defaultTemplateArgsSchema.optional(),
    direktoratTemplateArgs: direktoratTemplateArgsSchema.optional(),
  })
  .refine(
    (data) => {
      if ((!data.template || data.template === "default") && !data.defaultTemplateArgs) {
        return false;
      }
      return true;
    },
    {
      message: "defaultTemplateArgs are required when using the default template",
    },
  )
  .refine((data) => !(data.template === "direktorat" && !data.direktoratTemplateArgs), {
    message: "direktoratTemplateArgs are required when using the direktorat template",
  });
export type DynamicMdPdfConfig = z.infer<typeof dynamicMdPdfConfigSchema>;

// Add the dynamic property
export const generateDocumentOptionsSchema = configSchema
  .and(
    z.object({
      dynamic: dynamicMdPdfConfigSchema,
    }),
  )
  .refine((data) => !(data.merge_css && !data.css), {
    message: "css must be provided when merge_css is true",
  });
export type GenerateDocumentRequestOptions = z.infer<typeof generateDocumentOptionsSchema>;

export const generateDocumentRequestSchema = z.object({
  md: z.string(),
  mdVariables: mdVariablesSchema.nullish(),
  options: generateDocumentOptionsSchema,
});
export type GenerateDocumentRequest = z.infer<typeof generateDocumentRequestSchema>;
