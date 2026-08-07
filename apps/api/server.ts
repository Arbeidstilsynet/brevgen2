import fastifyCors from "@fastify/cors";
import { FastifyOtelInstrumentation } from "@fastify/otel";
import { configDotenv } from "dotenv";
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { fastify } from "./app";
import { setupAuth } from "./auth";
import { registerDocumentGenerationRoute } from "./lib/documentGenerationRoute";
import { createGenerationSchedulerFromEnvironment } from "./lib/generationScheduler";
import { StartupHealthCheck, registerHealthRoutes } from "./lib/healthRoutes";
import {
  createDocumentGenerationHandler,
  formatZodFastifySchemaValidationError,
  ValidationError,
} from "./lib/handler";
import { mdToPdf } from "./lib/core";
import { registerRendererHealthMetrics } from "./lib/otel";
import { registerSwagger } from "./swagger";

configDotenv();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const isDev = process.env.NODE_ENV === "development";

export async function initializeServer() {
  const generationScheduler = createGenerationSchedulerFromEnvironment();
  const handlerGenerateDocument = createDocumentGenerationHandler(generationScheduler);
  registerRendererHealthMetrics(generationScheduler.rendererHealth);
  const startupHealth = new StartupHealthCheck(
    () =>
      generationScheduler.schedule(({ progress, timeoutMs }) =>
        mdToPdf("# Brevgenerator startup check", {}, progress, timeoutMs),
      ),
    (error) => {
      fastify.log.error(
        { event: "renderer.startup_warmup.failed", error },
        "Renderer startup warm-up failed",
      );
    },
  );
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
        startupHealth: {
          method: "GET",
          path: "/health/startup",
          description: "Renderer startup check",
        },
        readinessHealth: {
          method: "GET",
          path: "/health/readiness",
          description: "Renderer readiness check",
        },
        livenessHealth: {
          method: "GET",
          path: "/health/liveness",
          description: "Renderer liveness check",
        },
        genererbrev: {
          method: "POST",
          path: "/genererbrev",
          description: "Generate document from markdown template",
        },
        docs: { method: "GET", path: "/docs", description: "API documentation" },
      },
    });
  });

  await registerHealthRoutes(fastify, generationScheduler.rendererHealth, startupHealth);

  await registerDocumentGenerationRoute(fastify, handlerGenerateDocument);

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
