import { pino, type LoggerOptions } from "pino";

// NODE_ENV=development is equivalent to running locally (pnpm dev), while Docker is always "production"
const environment = process.env.NODE_ENV ?? "development";

/**
 * Rounds Fastify's `responseTime` (ms). Unrounded values sometimes have exactly 11 decimals, which
 * the Nais log pipeline masks as a national identity number, breaking numeric parsing in Loki.
 */
export function formatLogObject(object: Record<string, unknown>): Record<string, unknown> {
  if (typeof object.responseTime === "number") {
    return { ...object, responseTime: Math.round(object.responseTime * 100) / 100 };
  }
  return object;
}

const loggerOptions: LoggerOptions = {
  formatters: { log: formatLogObject },
  ...(environment === "development" && {
    level: "debug",
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
      },
    },
  }),
};

/** Process-wide logger. Fastify derives its request loggers from this instance. */
export const logger = pino(loggerOptions);
