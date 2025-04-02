import fastifyCors from "@fastify/cors";
import type { GenerateDocumentRequest } from "@repo/shared-types";
import { fastify } from "./app";
import { handlerGenerateDocument, ValidationError } from "./lib/handler";

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

// local CORS workaround
fastify.register(fastifyCors, {
  origin: "*",
  methods: ["OPTIONS", "GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

fastify.get("/health", { logLevel: "warn" }, async (request, reply) => {
  reply.status(200).send();
});

fastify.post("/genererbrev", async (request, reply) => {
  try {
    fastify.log.info(request.body);
    const result = await handlerGenerateDocument(request.body as GenerateDocumentRequest);
    reply.send(result);
  } catch (err) {
    fastify.log.error("Error processing request:", err);

    if (err instanceof ValidationError) {
      return reply.status(400).send({
        message: "Validation error",
        error: err.message,
        details: err.details,
      });
    }
    if (err instanceof TypeError) {
      return reply.status(400).send({
        message: "Invalid input",
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
