import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, test, vi } from "vitest";
import { buildApp } from "./app";
import type { GenerateDocument } from "./http/routes/genererbrev";
import { StartupHealthCheck } from "./http/routes/health";
import { RendererHealth } from "./renderer/health";
import { HTTP_HANDLER_TIMEOUT_MS } from "./timeout-budget";

let currentApp: FastifyInstance | undefined;

async function createApp({ auth }: { auth: boolean }) {
  vi.stubEnv("DANGEROUS_DISABLE_AUTH", auth ? "false" : "true");
  vi.stubEnv("AZURE_APPLICATION_ID", "test-application");
  const generateDocument = vi.fn<GenerateDocument>(async () => ({ content: "<p>ok</p>" }));
  const app = await buildApp({
    generateDocument,
    rendererHealth: new RendererHealth({
      maxConcurrentJobs: 1,
      stallThresholdMs: 100,
      recoveryGraceMs: 100,
    }),
    startupHealth: new StartupHealthCheck(async () => undefined),
  });
  currentApp = app;
  return { app, generateDocument };
}

afterEach(async () => {
  await currentApp?.close();
  currentApp = undefined;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const validRequest = { md: "# Test", options: { as_html: true, dynamic: { template: "blank" } } };

describe("app", () => {
  test("configures an HTTP handler timeout below the ingress timeout", async () => {
    const { app } = await createApp({ auth: false });

    expect(HTTP_HANDLER_TIMEOUT_MS).toBe(55_000);
    expect(Reflect.get(app.initialConfig, "handlerTimeout")).toBe(HTTP_HANDLER_TIMEOUT_MS);
  });

  test("routes valid document requests to the document generator", async () => {
    const { app, generateDocument } = await createApp({ auth: false });

    const response = await app.inject({
      method: "POST",
      url: "/genererbrev",
      payload: validRequest,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("<p>ok</p>");
    expect(generateDocument).toHaveBeenCalledWith(validRequest, expect.any(AbortSignal));
  });

  test("answers request schema violations with a 400 validation error body", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { app, generateDocument } = await createApp({ auth: false });

    const response = await app.inject({
      method: "POST",
      url: "/genererbrev",
      payload: { md: "# Test", options: {} },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: "Validation error",
      error:
        "Validation failed - options.dynamic: Invalid input: expected object, received undefined",
      details: [
        {
          path: "options.dynamic",
          message: "Invalid input: expected object, received undefined",
          code: "invalid_type",
        },
      ],
    });
    expect(generateDocument).not.toHaveBeenCalled();
  });

  test("authenticates document requests before validating them", async () => {
    const { app, generateDocument } = await createApp({ auth: true });

    const response = await app.inject({ method: "POST", url: "/genererbrev", payload: {} });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "FST_JWT_NO_AUTHORIZATION_IN_HEADER" });
    expect(generateDocument).not.toHaveBeenCalled();
  });

  test("describes the API at the root path", async () => {
    vi.stubEnv("GIT_SHA", "abcdef1234");
    const { app } = await createApp({ auth: false });

    const response = await app.inject("/");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      name: "Brevgenerator2 API",
      version: "abcdef1",
      endpoints: { genererbrev: { method: "POST", path: "/genererbrev" } },
    });
  });
});
