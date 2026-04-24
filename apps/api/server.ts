import { DynamicMarkdownParseError } from "@at/dynamic-markdown";
import fastifyCors from "@fastify/cors";
import { FastifyOtelInstrumentation } from "@fastify/otel";
import { generateDocumentRequestSchema } from "@repo/shared-types";
import { configDotenv } from "dotenv";
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";
import { fastify } from "./app";
import { setupAuth } from "./auth";
import {
  formatZodFastifySchemaValidationError,
  handlerGenerateDocument,
  ValidationError,
} from "./lib/handler";
import { documentsGenerated } from "./lib/otel";
import { buildGenerateDocumentRequestContext } from "./lib/requestContext";
import { registerSwagger } from "./swagger";

configDotenv();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const isDev = process.env.NODE_ENV === "development";

export async function initializeServer() {
  const fastifyOtelInstrumentation = new FastifyOtelInstrumentation();
  await fastify.register(fastifyOtelInstrumentation.plugin());
  await setupAuth(fastify);
  await registerSwagger(fastify);

  // local CORS workaround
  await fastify.register(fastifyCors, {
    origin: "*",
    methods: ["OPTIONS", "GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Custom error handler for validation errors
  fastify.setErrorHandler((error, request, reply) => {
    // Handle Fastify validation errors (from request schema validation)
    if (hasZodFastifySchemaValidationErrors(error)) {
      console.log({ fn: "setErrorHandler, hasZodFastifySchemaValidationErrors", error });
      return reply.status(400).send(formatZodFastifySchemaValidationError(error.validation));
    }

    // Handle custom ValidationError from handler
    if (error instanceof ValidationError) {
      return reply.status(400).send({
        message: "Validation error",
        error: error.message,
        details: error.details,
      });
    }

    // For other errors, use default handling
    reply.send(error);
  });

  fastify.get("/", { logLevel: "warn" }, async (request, reply) => {
    reply.status(200).send({
      name: "Brevgenerator2 API",
      version: process.env.GIT_SHA?.substring(0, 7) ?? "dev",
      endpoints: {
        health: { method: "GET", path: "/health", description: "Health check" },
        genererbrev: {
          method: "POST",
          path: "/genererbrev",
          description: "Generate document from markdown template",
        },
        docs: { method: "GET", path: "/docs", description: "API documentation" },
      },
    });
  });

  fastify.get("/health", { logLevel: "warn", config: { otel: false } }, async (request, reply) => {
    reply.status(200).send();
  });

  const errorResponseSchema = z.object({
    message: z.string(),
    error: z.string(),
  });

  const validationErrorResponseSchema = errorResponseSchema.extend({
    details: z
      .array(
        z.object({
          path: z.string(),
          message: z.string(),
          code: z.string(),
        }),
      )
      .nullish(),
  });

  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/genererbrev",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Generate document from markdown template",
        security: [{ bearerAuth: [] }],
        body: generateDocumentRequestSchema,
        response: {
          200: z.string().describe("HTML or Base64-encoded PDF"),
          400: validationErrorResponseSchema.describe("Validation or parse error"),
          500: errorResponseSchema.describe("Internal server error"),
        },
      },
    },
    async (request, reply) => {
      const user = request.user;
      try {
        request.log.info(
          { requestContext: buildGenerateDocumentRequestContext(request.body, user) },
          "genererbrev.request",
        );
        const result = await handlerGenerateDocument(request.body);
        const template = request.body.options.dynamic.template ?? "default";
        const outputFormat = request.body.options.as_html ? "html" : "pdf";
        documentsGenerated.add(1, { template, output_format: outputFormat });
        reply.send(result);
      } catch (err) {
        request.log.error(err, "Error processing request:");

        if (err instanceof DynamicMarkdownParseError) {
          return reply.status(400).send({
            message: "Parse error",
            error: err.message,
          });
        }
        const error = err instanceof Error ? err.message : String(err);
        reply.status(500).send({ message: "Internal error", error });
      }
    },
  );

  // avoid conflict with Vite dev server
  if (!isDev) {
    fastify.listen(
      {
        port,
        host: "0.0.0.0", // Listen on all interfaces
      },
      (err) => {
        if (err) {
          fastify.log.error(err);
          process.exit(1);
        }
      },
    );
  }
}

if (!isDev) {
  initializeServer().catch((err) => {
    console.error("Failed to initialize server:", err);
    process.exit(1);
  });
}

export { fastify };
