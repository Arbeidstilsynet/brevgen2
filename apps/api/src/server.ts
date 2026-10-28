import fastifyCors from "@fastify/cors";
import { FastifyOtelInstrumentation } from "@fastify/otel";
import { configDotenv } from "dotenv";
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { fastify } from "./app";
import { setupAuth } from "./http/auth";
import { registerDocumentGenerationRoute } from "./http/routes/genererbrev";
import { createGenerationSchedulerFromEnvironment } from "./generation/scheduler";
import { StartupHealthCheck, registerHealthRoutes } from "./http/routes/health";
import { createDocumentGenerator } from "./generation/document-generator";
import { formatZodFastifySchemaValidationError } from "./http/errors";
import { mdToPdf } from "./renderer";
import { defaultConfig } from "./renderer/config";
import { registerRendererHealthMetrics } from "./renderer/health-metrics";
import { registerSwagger } from "./http/swagger";

configDotenv();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

const generationScheduler = createGenerationSchedulerFromEnvironment();
const documentGenerator = createDocumentGenerator({
  scheduler: generationScheduler,
  render: mdToPdf,
});
registerRendererHealthMetrics(generationScheduler.rendererHealth);
fastify.addHook("onClose", async () => {
  generationScheduler.rendererHealth.stop();
});
const startupHealth = new StartupHealthCheck(
  () =>
    generationScheduler.schedule(({ progress, timeoutMs }) =>
      mdToPdf("# Brevgenerator startup check", defaultConfig, progress, timeoutMs),
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

await registerDocumentGenerationRoute(fastify, (request, signal) =>
  documentGenerator.generate(request, signal),
);

await fastify.listen({
  port,
  host: "0.0.0.0", // Listen on all interfaces
});
