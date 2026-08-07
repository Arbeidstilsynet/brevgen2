import { expect, test } from "vitest";
import { fastify } from "../app";
import { HTTP_HANDLER_TIMEOUT_MS } from "./core/helpers";

test("configures an HTTP handler timeout below the ingress timeout", () => {
  expect(HTTP_HANDLER_TIMEOUT_MS).toBe(55_000);
  expect(Reflect.get(fastify.initialConfig, "handlerTimeout")).toBe(HTTP_HANDLER_TIMEOUT_MS);
});
