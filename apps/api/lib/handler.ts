import { parseDynamicMd } from "@at/dynamic-markdown";
import { type GenerateDocumentRequest, generateDocumentRequestSchema } from "@repo/shared-types";
import { ZodFastifySchemaValidationError } from "fastify-type-provider-zod";
import { ZodError } from "zod";
import { generateDocument } from "./generateDocument";
import { generationScheduler } from "./generationScheduler";

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
    const details: ValidationErrorDetail[] = error.issues.map((err) => ({
      path: err.path.join("."),
      message: err.message,
      code: err.code,
    }));

    return new ValidationError(
      "Validation failed - " +
        error.issues.map((err) => `${err.path.join(".")}: ${err.message}`).join("; "),
      details,
    );
  }
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

/**
 * @returns HTML or Base64-encoded PDF
 */
export async function handlerGenerateDocument(
  request: GenerateDocumentRequest,
  signal?: AbortSignal,
) {
  try {
    generateDocumentRequestSchema.parse(request);
  } catch (error) {
    if (error instanceof ZodError) {
      throw ValidationError.fromZodError(error);
    }
    throw error;
  }

  const { md, mdVariables, options } = request;

  const parsedMd = parseDynamicMd(md, { variables: mdVariables ?? {} });
  const result = await generationScheduler.schedule(
    () => generateDocument(parsedMd, options),
    signal,
  );
  if (typeof result.content === "string") {
    return result.content;
  }
  return result.content.toString("base64");
}
