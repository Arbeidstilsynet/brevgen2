import Fastify from "fastify";
import { HTTP_HANDLER_TIMEOUT_MS } from "./lib/core/helpers";

// NODE_ENV=development is equivalent to running locally (pnpm dev), while Docker is always "production"
const environment = process.env.NODE_ENV ?? "development";

export const fastify = Fastify({
  handlerTimeout: HTTP_HANDLER_TIMEOUT_MS,
  logger:
    environment === "development"
      ? {
          level: "debug",
          transport: {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
            },
          },
        }
      : true,
});
export const logger = fastify.log;
