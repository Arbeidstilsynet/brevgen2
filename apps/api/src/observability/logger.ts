import { pino } from "pino";

// NODE_ENV=development is equivalent to running locally (pnpm dev), while Docker is always "production"
const environment = process.env.NODE_ENV ?? "development";

/** Process-wide logger. Fastify derives its request loggers from this instance. */
export const logger = pino(
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
    : {},
);
