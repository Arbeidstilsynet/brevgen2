import fastifyCors from "@fastify/cors";
import type { GenerateDocumentRequest } from "@repo/shared-types";
import { configDotenv } from "dotenv";
import { DynamicMarkdownParseError } from "../../packages/dynamic-markdown/lib/ast/error";
import { fastify } from "./app";
import { setupAuth } from "./auth";
import { handlerGenerateDocument, ValidationError } from "./lib/handler";

configDotenv();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

const { DANGEROUS_DISABLE_AUTH } = setupAuth(fastify);

// local CORS workaround
fastify.register(fastifyCors, {
  origin: "*",
  methods: ["OPTIONS", "GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
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
    },
  });
});

fastify.get("/health", { logLevel: "warn" }, async (request, reply) => {
  reply.status(200).send();
});

fastify.post("/genererbrev", async (request, reply) => {
  if (!DANGEROUS_DISABLE_AUTH) {
    const user = request.user;
    request.log.debug({ user });
  }
  try {
    request.log.info(request.body);
    const result = await handlerGenerateDocument(request.body as GenerateDocumentRequest);
    reply.send(result);
  } catch (err) {
    request.log.error(err, "Error processing request:");

    if (err instanceof ValidationError) {
      return reply.status(400).send({
        message: "Validation error",
        error: err.message,
        details: err.details,
      });
    }
    if (err instanceof DynamicMarkdownParseError) {
      return reply.status(400).send({
        message: "Parse error",
        error: err.message,
      });
    }
    const error = err instanceof Error ? err.message : String(err);
    reply.status(500).send({ message: "Internal error", error });
  }
});

// avoid conflict with Vite dev server
if (process.env.NODE_ENV !== "development") {
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

export { fastify };
