import Fastify, { type RawServerDefault } from "fastify";
import { logger } from "./observability/logger";
import { HTTP_HANDLER_TIMEOUT_MS } from "./timeout-budget";

// The explicit server type keeps the default `FastifyBaseLogger` instead of inferring pino's
// `Logger`, so the instance stays assignable to plain `FastifyInstance` parameters.
export const fastify = Fastify<RawServerDefault>({
  handlerTimeout: HTTP_HANDLER_TIMEOUT_MS,
  loggerInstance: logger,
});
