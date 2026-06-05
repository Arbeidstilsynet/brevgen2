import { defaultTemplate, resolveTemplate } from "@at/document-templates";
import type { GenerateDocumentRequestOptions } from "@repo/shared-types";
import { describe, expect, test } from "vitest";

function makeOptions(
  overrides: Partial<GenerateDocumentRequestOptions["dynamic"]> = {},
): GenerateDocumentRequestOptions {
  return {
    css: "",
    merge_css: false,
    document_title: "",
    page_media_type: "screen",
    pdf_options: {},
    as_html: false,
    dynamic: {
      template: "default",
      defaultTemplateArgs: {
        language: "bm",
        signatureVariant: "elektroniskGodkjent",
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
      ...overrides,
    },
  };
}

describe("default template registry", () => {
  test("resolves the default template by name", () => {
    expect(resolveTemplate("default")?.name).toBe("default");
  });

  test("resolves the default template when no template is specified", () => {
    expect(resolveTemplate(undefined)).toBe(resolveTemplate("default"));
  });

  test("does not yet resolve direktorat, blank or custom templates", () => {
    expect(resolveTemplate("direktorat")).toBeUndefined();
    expect(resolveTemplate("blank")).toBeUndefined();
    expect(resolveTemplate("custom")).toBeUndefined();
  });
});

describe("default template markdown assembly", () => {
  test("wraps the body markdown with a letterhead and a signature", () => {
    const md = resolveTemplate("default")!.getMd("# Body", makeOptions());

    expect(md).toContain("Vår dato: 13.09.2024");
    expect(md).toContain("Vår referanse: 2024/1234");
    expect(md).toContain("# Body");
    expect(md).toContain("Med vennlig hilsen");
  });

  test("omits the signature for the usignert variant", () => {
    const options = makeOptions({
      defaultTemplateArgs: {
        language: "bm",
        signatureVariant: "usignert",
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
    });

    const md = resolveTemplate("default")!.getMd("# Body", options);

    expect(md).not.toContain("Med vennlig hilsen");
  });
});

describe("default template pdf config", () => {
  test("uses the template css and a footer with the saksnummer", () => {
    const pdfConfig = resolveTemplate("default")!.getPdfConfig(makeOptions());

    expect(pdfConfig.css).toBe(defaultTemplate.globalCss);
    expect(pdfConfig.pdf_options?.displayHeaderFooter).toBe(true);
    expect(pdfConfig.pdf_options?.footerTemplate).toContain("Vår referanse: 2024/1234");
  });
});

describe("default template argument validation", () => {
  test("throws when the default template args are missing", () => {
    const options = makeOptions({ defaultTemplateArgs: undefined });

    expect(() => resolveTemplate("default")!.getMd("# Body", options)).toThrow(/expected object/i);
  });
});
