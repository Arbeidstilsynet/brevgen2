import { defaultTemplate } from "@at/document-templates";
import { generateLoremIpsum, parseDynamicMd } from "@at/dynamic-markdown";
import fs from "fs";
import path from "path";
import { describe, expect, test, vi } from "vitest";
import { generatePdf } from "./pdf";

describe("validation", () => {
  test.each([
    ["undefined", undefined],
    ["empty options", {}],
    ["empty options.dynamic", { dynamic: {} }],
  ])("missing defaultTemplateFields (%s) throws", async (_, options) => {
    const testdata = {
      md: `# Vedtak om at dere blir tilbakekalt`,
    };

    const parsedMd = parseDynamicMd(testdata.md);
    await expect(() => generatePdf(parsedMd, options)).rejects.toThrow(
      "defaultTemplateArgs are required when using the default template",
    );
  });

  test("missing defaultTemplateArgs.fields.unntattOffentlighetHjemmel throws", async () => {
    const testdata = {
      md: `# Vedtak om at dere blir tilbakekalt`,
    };

    const parsedMd = parseDynamicMd(testdata.md);
    await expect(() =>
      generatePdf(parsedMd, {
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
      }),
    ).rejects.toThrow(
      "defaultTemplateArgs.fields.unntattOffentlighetHjemmel is required when defaultTemplateArgs.fields.erUnntattOffentlighet is true",
    );
  });
});

const defaultTemplateArgs: defaultTemplate.DefaultTemplateArgs = {
  language: "bm",
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
  signatureVariant: "automatiskBehandlet",
};
describe.skip("pdf generation", () => {
  describe("templates", () => {
    test("can use custom template", async () => {
      // vi.stubEnv("DEBUG", "1");

      const parsedMd = parseDynamicMd("# Lorem ipsum");
      const pdf = await generatePdf(parsedMd, {
        document_title: "Hello, world",
        dynamic: {
          template: "custom",
        },
        pdf_options: {
          displayHeaderFooter: true,
          format: "A4",
        },
      });
      expect(pdf.content.length).toBeGreaterThan(0);
      fs.writeFileSync(path.resolve(__dirname, "test-custom.pdf"), pdf.content);
    });
  });

  test("hello world", async () => {
    const md = "# Hello, world!\n## Subtitle";
    const pdf = await generatePdf(md, {
      document_title: "Hello, world",
      dynamic: {
        defaultTemplateArgs,
      },
    });
    expect(pdf.content.length).toBeGreaterThan(0);
  });

  test("pdf is sanitized", async () => {
    const pdfPromise = generatePdf("# Hello, world <script>alert('XSS')</script>", {
      document_title: "Hello, world",
      dynamic: {
        defaultTemplateArgs,
      },
    });

    const pdf = await Promise.race([
      pdfPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Test timed out, alert was not sanitized")), 4000),
      ),
    ]);
    expect(pdf).toBeDefined();
  });

  test("standard letter with footer and letterhead", async () => {
    vi.stubEnv("IS_LOCAL", "true");

    const testdata = {
      md: `# Vedtak om at dere blir tilbakekalt

${generateLoremIpsum(100)}

## Dette må dere gjøre
${generateLoremIpsum(200)}

{{ if kanKlage == true ::
## Dere kan klage innen {{ klageFrist }}
${generateLoremIpsum(100)}
}}
`,
      variables: {
        kanKlage: true,
        klageFrist: "10.10.2024",
      },
    };

    const parsedMd = parseDynamicMd(testdata.md, {
      variables: testdata.variables,
    });
    const pdf = await generatePdf(parsedMd, {
      document_title: "Hello, world",
      dynamic: {
        defaultTemplateArgs,
      },
    });

    fs.writeFileSync(path.resolve(__dirname, "test.pdf"), pdf.content);
  });
});
