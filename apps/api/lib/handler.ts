import { parseDynamicMd } from "@at/dynamic-markdown";
import { type GenerateDocumentRequest, generateDocumentRequestSchema } from "@repo/shared-types";
import pLimit from "p-limit";
import { ZodError } from "zod";
import { generateDocument } from "./generateDocument";

// limit parallel generation to reduce CPU spikes
const MAX_PARALLEL_GENERATION = 10;
const limit = pLimit(MAX_PARALLEL_GENERATION);

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

/**
 * @returns HTML or Base64-encoded PDF
 */
export async function handlerGenerateDocument(request: GenerateDocumentRequest) {
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
  const result = await limit(() => generateDocument(parsedMd, options));
  if (typeof result.content === "string") {
    return result.content;
  }
  return result.content.toString("base64");
}
