import { afterEach, describe, expect, test, vi } from "vitest";
import type { GenerateDocument } from "./http/routes/genererbrev";
import { createTestApp } from "./testing/create-test-app";
import { HTTP_HANDLER_TIMEOUT_MS } from "./timeout-budget";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("app", () => {
  test("configures the HTTP handler timeout from the timeout budget", async () => {
    const app = await createTestApp();

    expect(Reflect.get(app.initialConfig, "handlerTimeout")).toBe(HTTP_HANDLER_TIMEOUT_MS);
  });

  test("answers request schema violations with a 400 validation error body", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const generateDocument = vi.fn<GenerateDocument>();
    const app = await createTestApp({ generateDocument });

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
    const generateDocument = vi.fn<GenerateDocument>();
    const app = await createTestApp({ auth: true, generateDocument });

    const response = await app.inject({ method: "POST", url: "/genererbrev", payload: {} });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "FST_JWT_NO_AUTHORIZATION_IN_HEADER" });
    expect(generateDocument).not.toHaveBeenCalled();
  });

  test("describes the API at the root path", async () => {
    vi.stubEnv("GIT_SHA", "abcdef1234");
    const app = await createTestApp();

    const response = await app.inject("/");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      name: "Brevgenerator2 API",
      version: "abcdef1",
      endpoints: { genererbrev: { method: "POST", path: "/genererbrev" } },
    });
  });
});
