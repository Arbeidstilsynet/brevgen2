import { expect, test } from "vitest";
import { handlerGeneratePdf } from "./handler";

test.skip("Runs function handler", async () => {
  const input = "# Hello, {{ name }}";
  const mdVariables = { name: "world" };
  const response = await handlerGeneratePdf({ md: input, mdVariables });
  expect(response).toBe("Hello, world");
});
