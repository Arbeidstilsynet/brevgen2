import fastifyCors from "@fastify/cors";
import { FastifyOtelInstrumentation } from "@fastify/otel";
import Fastify, { type FastifyInstance, type RawServerDefault } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { setupAuth } from "./http/auth";
import { errorHandler } from "./http/errors";
import { type GenerateDocument, registerDocumentGenerationRoute } from "./http/routes/genererbrev";
import { registerHealthRoutes, type StartupHealthCheck } from "./http/routes/health";
import { registerRootRoute } from "./http/routes/root";
import { registerSwagger } from "./http/swagger";
import { logger } from "./observability/logger";
import type { RendererHealth } from "./renderer/health";
import { HTTP_HANDLER_TIMEOUT_MS } from "./timeout-budget";

export interface AppDependencies {
  generateDocument: GenerateDocument;
  rendererHealth: RendererHealth;
  startupHealth: StartupHealthCheck;
}

/**
 * Build the HTTP app with all plugins and routes registered, without listening. Auth reads its
 * configuration from the environment.
 */
export async function buildApp({
  generateDocument,
  rendererHealth,
  startupHealth,
}: AppDependencies): Promise<FastifyInstance> {
  // The explicit server type keeps the default `FastifyBaseLogger` instead of inferring pino's
  // `Logger`, so the instance stays assignable to plain `FastifyInstance` parameters.
  const fastify = Fastify<RawServerDefault>({
    handlerTimeout: HTTP_HANDLER_TIMEOUT_MS,
    loggerInstance: logger,
  });

  await fastify.register(new FastifyOtelInstrumentation().plugin());
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
  fastify.setErrorHandler(errorHandler);

  await registerRootRoute(fastify);
  await registerHealthRoutes(fastify, rendererHealth, startupHealth);
  await registerDocumentGenerationRoute(fastify, generateDocument);

  return fastify;
}
