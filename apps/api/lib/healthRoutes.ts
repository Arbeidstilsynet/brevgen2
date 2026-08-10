import type { FastifyInstance } from "fastify";
import type { RendererHealth } from "./rendererHealth";

export type StartupHealthStatus = "pending" | "succeeded" | "failed";

export class StartupHealthCheck {
  private status: StartupHealthStatus = "pending";
  readonly result: Promise<void>;

  constructor(warmup: () => Promise<unknown>, onFailure?: (error: unknown) => void) {
    this.result = this.run(warmup, onFailure);
  }

  getStatus(): StartupHealthStatus {
    return this.status;
  }

  private async run(
    warmup: () => Promise<unknown>,
    onFailure?: (error: unknown) => void,
  ): Promise<void> {
    try {
      await warmup();
      this.status = "succeeded";
    } catch (error) {
      this.status = "failed";
      onFailure?.(error);
    }
  }
}

const healthRouteOptions = {
  logLevel: "warn" as const,
  config: { otel: false },
};

export async function registerHealthRoutes(
  fastify: FastifyInstance,
  rendererHealth: RendererHealth,
  startupHealth: StartupHealthCheck,
): Promise<void> {
  fastify.get("/health", healthRouteOptions, async (_request, reply) => {
    reply.status(200).send();
  });

  fastify.get("/health/startup", healthRouteOptions, async (_request, reply) => {
    const status = startupHealth.getStatus();
    reply.status(status === "succeeded" ? 200 : 503).send({ status });
  });

  fastify.get("/health/readiness", healthRouteOptions, async (_request, reply) => {
    const snapshot = rendererHealth.getSnapshot();
    reply.status(snapshot.ready ? 200 : 503).send({ status: snapshot.state });
  });

  fastify.get("/health/liveness", healthRouteOptions, async (_request, reply) => {
    const snapshot = rendererHealth.getSnapshot();
    reply.status(snapshot.live ? 200 : 503).send({ status: snapshot.state });
  });
}
