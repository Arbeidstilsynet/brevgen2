import type { GenerateDocumentRequest, GenerateDocumentRequestOptions } from "@repo/shared-types";
import { describe, expect, test } from "vitest";
import { handlerGenerateDocument, ValidationError } from "./handler";

describe("schema validation", () => {
  test("missing defaultTemplateFields (undefined) throws", async () => {
    const testdata = {
      md: `# Vedtak om at dere blir tilbakekalt`,
    };
    const args: GenerateDocumentRequest = {
      md: testdata.md,
      mdVariables: {},
      options: undefined as unknown as GenerateDocumentRequestOptions,
    };

    const expectedError = new ValidationError(
      "Validation failed - options: Invalid input; options: Invalid input: expected object, received undefined",
      [
        {
          code: "invalid_union",
          message: "Invalid input",
          path: "options",
        },
        {
          code: "invalid_type",
          message: "Invalid input: expected object, received undefined",
          path: "options",
        },
      ],
    );

    await expect(() => handlerGenerateDocument(args)).rejects.toThrowError(expectedError);
  });

  test("missing defaultTemplateFields (empty options) throws", async () => {
    const testdata = {
      md: `# Vedtak om at dere blir tilbakekalt`,
    };
    const args: GenerateDocumentRequest = {
      md: testdata.md,
      mdVariables: {},
      options: {} as GenerateDocumentRequestOptions,
    };

    const expectedError = new ValidationError(
      "Validation failed - options.dynamic: Invalid input: expected object, received undefined",
      [
        {
          code: "invalid_type",
          message: "Invalid input: expected object, received undefined",
          path: "options.dynamic",
        },
      ],
    );

    await expect(() => handlerGenerateDocument(args)).rejects.toThrowError(expectedError);
  });

  test("missing defaultTemplateFields (empty options.dynamic) throws", async () => {
    const testdata = {
      md: `# Vedtak om at dere blir tilbakekalt`,
    };
    const args: GenerateDocumentRequest = {
      md: testdata.md,
      mdVariables: {},
      options: { dynamic: {} } as GenerateDocumentRequestOptions,
    };

    const expectedError = new ValidationError(
      "Validation failed - options.dynamic: defaultTemplateArgs are required when using the default template",
      [
        {
          code: "custom",
          message: "defaultTemplateArgs are required when using the default template",
          path: "options.dynamic",
        },
      ],
    );

    await expect(() => handlerGenerateDocument(args)).rejects.toThrowError(expectedError);
  });

  test("missing defaultTemplateArgs.fields.unntattOffentlighetHjemmel throws", async () => {
    const testdata = {
      md: `# Vedtak om at dere blir tilbakekalt`,
    };
    const args: GenerateDocumentRequest = {
      md: testdata.md,
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
                navn: "Nissene på jordet AS",
                adresse: "Akersgata 123",
                postnr: "0152",
                poststed: "Oslo",
              },
              erUnntattOffentlighet: true,
              unntattOffentlighetHjemmel: undefined,
            },
          },
        },
      },
    };

    const expectedError = new ValidationError(
      "Validation failed - options.dynamic.defaultTemplateArgs.fields: unntattOffentlighetHjemmel is required when erUnntattOffentlighet is true",
      [
        {
          code: "custom",
          message: "unntattOffentlighetHjemmel is required when erUnntattOffentlighet is true",
          path: "options.dynamic.defaultTemplateArgs.fields",
        },
      ],
    );

    await expect(() => handlerGenerateDocument(args)).rejects.toThrowError(expectedError);
  });

  test("invalid language throws", async () => {
    const testdata = {
      md: `# Vedtak om at dere blir tilbakekalt`,
    };
    const args: GenerateDocumentRequest = {
      md: testdata.md,
      options: {
        dynamic: {
          defaultTemplateArgs: {
            language: "bmmm" as "bm",
            signatureVariant: "automatiskBehandlet",
            fields: {
              dato: "13.09.2024",
              saksnummer: "2024/1234",
              saksbehandlerNavn: "Ola Nordmann",
              virksomhet: {
                navn: "Nissene på jordet AS",
                adresse: "Akersgata 123",
                postnr: "0152",
                poststed: "Oslo",
              },
            },
          },
        },
      },
    };

    const expectedError = new ValidationError(
      'Validation failed - options.dynamic.defaultTemplateArgs.language: Invalid option: expected one of "bm"|"nn"',
      [
        {
          code: "invalid_value",
          message: 'Invalid option: expected one of "bm"|"nn"',
          path: "options.dynamic.defaultTemplateArgs.language",
        },
      ],
    );

    await expect(() => handlerGenerateDocument(args)).rejects.toThrowError(expectedError);
  });

  test("invalid signatureVariant throws", async () => {
    const testdata = {
      md: `# Vedtak om at dere blir tilbakekalt`,
    };
    const args: GenerateDocumentRequest = {
      md: testdata.md,
      options: {
        dynamic: {
          defaultTemplateArgs: {
            language: "nn",
            signatureVariant: "automatiskBehandleteeeeet" as "automatiskBehandlet",
            fields: {
              dato: "13.09.2024",
              saksnummer: "2024/1234",
              saksbehandlerNavn: "Ola Nordmann",
              virksomhet: {
                navn: "Nissene på jordet AS",
                adresse: "Akersgata 123",
                postnr: "0152",
                poststed: "Oslo",
              },
            },
          },
        },
      },
    };

    const expectedError = new ValidationError(
      'Validation failed - options.dynamic.defaultTemplateArgs.signatureVariant: Invalid option: expected one of "elektroniskGodkjent"|"automatiskBehandlet"|"usignert"',
      [
        {
          code: "invalid_value",
          message:
            'Invalid option: expected one of "elektroniskGodkjent"|"automatiskBehandlet"|"usignert"',
          path: "options.dynamic.defaultTemplateArgs.signatureVariant",
        },
      ],
    );

    await expect(() => handlerGenerateDocument(args)).rejects.toThrowError(expectedError);
  });
});
