import type { ZodFastifySchemaValidationError } from "fastify-type-provider-zod";

export interface ValidationErrorDetail {
  path: string;
  message: string;
  code: string;
}

export interface ValidationErrorResponse {
  message: string;
  error: string;
  details: ValidationErrorDetail[];
}

export function formatZodFastifySchemaValidationError(
  validation: ZodFastifySchemaValidationError[],
): ValidationErrorResponse {
  const details: ValidationErrorDetail[] = validation.map((error) => ({
    path: error.instancePath.replace(/^\//, "").replaceAll("/", ".") || "body",
    message: error.message!,
    code: error.keyword,
  }));

  const errorMessage = details.map((detail) => `${detail.path}: ${detail.message}`).join("; ");

  return {
    message: "Validation error",
    error: `Validation failed - ${errorMessage}`,
    details,
  };
}
