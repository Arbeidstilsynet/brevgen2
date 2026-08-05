import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { describe, expect, test } from "vitest";
import { registerDocumentGenerationRoute } from "./documentGenerationRoute";
import { GenerationCancelledError, GenerationOverloadError } from "./generationScheduler";

describe("document generation route", () => {
  test("returns a retryable 503 response when document generation is overloaded", async () => {
    const app = Fastify();
    app.decorate("authenticate", async () => undefined);
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await registerDocumentGenerationRoute(app.withTypeProvider<ZodTypeProvider>(), async () => {
      throw new GenerationOverloadError("queue-full", 7);
    });

    const response = await app.inject({
      method: "POST",
      url: "/genererbrev",
      payload: {
        md: "# Test",
        options: {
          as_html: true,
          dynamic: {
            template: "blank",
          },
        },
      },
    });

    expect(response.statusCode).toBe(503);
    expect(response.headers["retry-after"]).toBe("7");
    expect(response.json()).toEqual({
      message: "Service unavailable",
      error: "Document generation queue is full",
    });

    await app.close();
  });

  test("does not report an unexpected 5xx when the caller disconnects while queued", async () => {
    const app = Fastify();
    app.decorate("authenticate", async () => undefined);
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    const loggedErrors: unknown[] = [];
    app.addHook("onRequest", async (request) => {
      request.log.error = (...args: unknown[]) => {
        loggedErrors.push(args);
      };
    });
    await registerDocumentGenerationRoute(app.withTypeProvider<ZodTypeProvider>(), async () => {
      throw new GenerationCancelledError();
    });

    const response = await app.inject({
      method: "POST",
      url: "/genererbrev",
      payload: {
        md: "# Test",
        options: {
          as_html: true,
          dynamic: {
            template: "blank",
          },
        },
      },
    });

    expect(response.statusCode).toBe(499);
    expect(loggedErrors).toEqual([]);

    await app.close();
  });
});
