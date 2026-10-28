import type { FastifyInstance } from "fastify";

export async function registerRootRoute(fastify: FastifyInstance): Promise<void> {
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
}
