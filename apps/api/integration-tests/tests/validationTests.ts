import { GenerateDocumentRequest } from "@repo/shared-types";
import { beforeAll, describe, expect, test } from "vitest";
import { ValidationErrorResponse } from "../../lib/handler";
import { fetcher, TestEnvironment } from "../utils";

export function validationTests(getTestEnv: () => TestEnvironment) {
  let testEnv: TestEnvironment;

  beforeAll(() => {
    testEnv = getTestEnv();
  });

  describe("Schema validation tests", () => {
    test("invalid dynamic markdown returns parse error", async () => {
      const payload: GenerateDocumentRequest = {
        md: `# This is {{ invalid`,
        mdVariables: {},
        options: {
          as_html: true,
          dynamic: {
            template: "blank",
          },
        },
      };

      const response = await fetcher(testEnv.genererBrevUrl, payload);
      expect(response.status).toBe(400);

      const error = (await response.json()) as ValidationErrorResponse;
      expect(error.message).toBe("Parse error");
      expect(error.error).toBe("Unclosed dynamic section at line 1");
    });

    test("missing options returns 400 with validation error", async () => {
      const payload = {
        md: "# Test",
        mdVariables: {},
        options: undefined!,
      } as GenerateDocumentRequest;

      const response = await fetcher(testEnv.genererBrevUrl, payload);
      expect(response.status).toBe(400);

      const error = (await response.json()) as ValidationErrorResponse;
      expect(error.message).toBe("Validation error");
      expect(error.error).toContain("Validation failed");
      expect(error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining("options") as string,
            code: expect.any(String) as string,
          }),
        ]),
      );
    });

    test("empty options returns 400 with validation error", async () => {
      const payload = {
        md: "# Test",
        mdVariables: {},
        options: {},
      } as GenerateDocumentRequest;

      const response = await fetcher(testEnv.genererBrevUrl, payload);
      expect(response.status).toBe(400);

      const error = (await response.json()) as ValidationErrorResponse;
      expect(error.message).toBe("Validation error");
      expect(error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "options.dynamic",
          }),
        ]),
      );
    });

    test("empty options.dynamic returns 400 with validation error", async () => {
      const payload = {
        md: "# Test",
        mdVariables: {},
        options: { dynamic: {} },
      } as GenerateDocumentRequest;

      const response = await fetcher(testEnv.genererBrevUrl, payload);
      expect(response.status).toBe(400);

      const error = (await response.json()) as ValidationErrorResponse;
      expect(error.message).toBe("Validation error");
      expect(error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "options.dynamic",
            message: expect.stringContaining("defaultTemplateArgs") as string,
          }),
        ]),
      );
    });

    test("missing unntattOffentlighetHjemmel when erUnntattOffentlighet is true returns 400", async () => {
      const payload = {
        md: "# Test",
        options: {
          dynamic: {
            defaultTemplateArgs: {
              language: "bm",
              signatureVariant: "automatiskBehandlet",
              fields: {
                dato: "13.09.2024",
                saksnummer: "2024/1234",
                saksbehandlerNavn: "Ola Nordmann",
                virksomhet: {
                  navn: "Test AS",
                  adresse: "Test 1",
                  postnr: "0152",
                  poststed: "Oslo",
                },
                erUnntattOffentlighet: true,
                unntattOffentlighetHjemmel: undefined,
              },
            },
          },
        },
      } as GenerateDocumentRequest;

      const response = await fetcher(testEnv.genererBrevUrl, payload);
      expect(response.status).toBe(400);

      const error = (await response.json()) as ValidationErrorResponse;
      expect(error.message).toBe("Validation error");
      expect(error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining("fields") as string,
            message: expect.stringContaining("unntattOffentlighetHjemmel") as string,
          }),
        ]),
      );
    });

    test("invalid language returns 400 with validation error", async () => {
      const payload = {
        md: "# Test",
        options: {
          dynamic: {
            defaultTemplateArgs: {
              language: "invalid",
              signatureVariant: "automatiskBehandlet",
              fields: {
                dato: "13.09.2024",
                saksnummer: "2024/1234",
                saksbehandlerNavn: "Ola Nordmann",
                virksomhet: {
                  navn: "Test AS",
                  adresse: "Test 1",
                  postnr: "0152",
                  poststed: "Oslo",
                },
              },
            },
          },
        },
      } as unknown as GenerateDocumentRequest;

      const response = await fetcher(testEnv.genererBrevUrl, payload);
      expect(response.status).toBe(400);

      const error = (await response.json()) as ValidationErrorResponse;
      expect(error.message).toBe("Validation error");
      expect(error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining("language") as string,
            code: "invalid_value",
          }),
        ]),
      );
    });

    test("invalid signatureVariant returns 400 with validation error", async () => {
      const payload = {
        md: "# Test",
        options: {
          dynamic: {
            defaultTemplateArgs: {
              language: "bm",
              signatureVariant: "invalid",
              fields: {
                dato: "13.09.2024",
                saksnummer: "2024/1234",
                saksbehandlerNavn: "Ola Nordmann",
                virksomhet: {
                  navn: "Test AS",
                  adresse: "Test 1",
                  postnr: "0152",
                  poststed: "Oslo",
                },
              },
            },
          },
        },
      } as unknown as GenerateDocumentRequest;

      const response = await fetcher(testEnv.genererBrevUrl, payload);
      expect(response.status).toBe(400);

      const error = (await response.json()) as ValidationErrorResponse;
      expect(error.message).toBe("Validation error");
      expect(error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining("signatureVariant") as string,
            code: "invalid_value",
          }),
        ]),
      );
    });
  });
}
