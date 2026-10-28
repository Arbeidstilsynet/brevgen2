import { expect, test } from "vitest";
import {
  DOCUMENT_GENERATION_TIMEOUT_MS,
  GATEWAY_TIMEOUT_MS,
  HTTP_HANDLER_TIMEOUT_MS,
} from "./timeout-budget";

test("each timeout fires before the layer outside it", () => {
  expect(DOCUMENT_GENERATION_TIMEOUT_MS).toBeLessThan(HTTP_HANDLER_TIMEOUT_MS);
  expect(HTTP_HANDLER_TIMEOUT_MS).toBeLessThan(GATEWAY_TIMEOUT_MS);
});
