import { readFileSync } from "node:fs";
import { generateDocumentRequestSchema } from "@repo/shared-types";
import { describe, expect, test } from "vitest";
import { z } from "zod";

const fixtures = z
  .record(z.string(), z.unknown())
  .parse(
    JSON.parse(
      readFileSync(
        new URL(
          "../../../../nuget-client/BrevgeneratorClient.Tests/Fixtures/serialized-requests.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  );

describe("C# serialized request contract", () => {
  test.each(Object.entries(fixtures))(
    "accepts the %s client request in the API schema",
    (_, request) => {
      expect(() => generateDocumentRequestSchema.parse(request)).not.toThrow();
    },
  );
});
