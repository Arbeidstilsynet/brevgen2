import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  type ZodFastifySchemaValidationError,
} from "fastify-type-provider-zod";

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

function formatZodFastifySchemaValidationError(
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

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // Handle Fastify validation errors (from request schema validation)
  if (hasZodFastifySchemaValidationErrors(error)) {
    console.log({ fn: "setErrorHandler, hasZodFastifySchemaValidationErrors", error });
    return reply.status(400).send(formatZodFastifySchemaValidationError(error.validation));
  }

  // For other errors, use default handling
  reply.send(error);
}
