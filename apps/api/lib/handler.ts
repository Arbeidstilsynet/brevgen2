import { parseDynamicMd } from "@at/dynamic-markdown";
import { type GenerateDocumentRequest, generateDocumentRequestSchema } from "@repo/shared-types";
import { ZodError } from "zod";
import { generateDocument } from "./generateDocument";

export interface ValidationErrorDetail {
  path: string;
  message: string;
  code: string;
}

export class ValidationError extends Error {
  details: ValidationErrorDetail[];

  constructor(message: string, details: ValidationErrorDetail[]) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }

  static fromZodError(error: ZodError): ValidationError {
    const details: ValidationErrorDetail[] = error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
      code: err.code,
    }));

    return new ValidationError(
      "Validation failed - " +
        error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("; "),
      details,
    );
  }
}

/**
 * @returns HTML or Base64-encoded PDF
 */
export async function handlerGenerateDocument({
  md,
  mdVariables,
  options,
}: GenerateDocumentRequest) {
  try {
    generateDocumentRequestSchema.parse({
      md: md,
      mdVariables,
      options,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw ValidationError.fromZodError(error);
    }
    throw error;
  }

  const parsedMd = parseDynamicMd(md, { variables: mdVariables ?? {} });
  const result = await generateDocument(parsedMd, options);
  if (typeof result.content === "string") {
    return result.content;
  }
  return result.content.toString("base64");
}
