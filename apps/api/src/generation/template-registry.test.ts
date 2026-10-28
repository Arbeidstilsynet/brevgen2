import {
  blankTemplate,
  defaultTemplate,
  direktoratTemplate,
  resolveTemplate,
} from "@at/document-templates";
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

  test("does not resolve the custom template", () => {
    expect(resolveTemplate("custom")).toBeUndefined();
  });
});

function makeDirektoratOptions(
  args: NonNullable<GenerateDocumentRequestOptions["dynamic"]["direktoratTemplateArgs"]>,
): GenerateDocumentRequestOptions {
  return {
    css: "",
    merge_css: false,
    document_title: "",
    page_media_type: "screen",
    pdf_options: {},
    as_html: false,
    dynamic: {
      template: "direktorat",
      direktoratTemplateArgs: args,
    },
  };
}

const direktoratArgs = {
  language: "bm",
  signatureVariant: "elektroniskGodkjent",
  fields: {
    dato: "22.01.2026",
    saksnummer: "2026/1234",
    saksbehandlerNavn: "Direktør Direktoratsen",
    mottaker: {
      navn: "Mottaker AS",
      adresse: "Direktoratveien 1",
      postnr: "0152",
      poststed: "Oslo",
    },
  },
} as const;

describe("direktorat template registry", () => {
  test("resolves the direktorat template by name", () => {
    expect(resolveTemplate("direktorat")?.name).toBe("direktorat");
  });

  test("wraps the body markdown with a letterhead and a signature", () => {
    const md = resolveTemplate("direktorat")!.getMd(
      "# Body",
      makeDirektoratOptions(direktoratArgs),
    );

    expect(md).toContain("Vår dato: 22.01.2026");
    expect(md).toContain("Mottaker AS");
    expect(md).toContain("# Body");
    expect(md).toContain("Med vennlig hilsen");
  });

  test("uses the template css and a footer with the saksnummer", () => {
    const pdfConfig = resolveTemplate("direktorat")!.getPdfConfig(
      makeDirektoratOptions(direktoratArgs),
    );

    expect(pdfConfig.css).toBe(direktoratTemplate.globalCss);
    expect(pdfConfig.pdf_options?.displayHeaderFooter).toBe(true);
    expect(pdfConfig.pdf_options?.footerTemplate).toContain("Vår referanse: 2026/1234");
  });

  test("throws when the direktorat template args are missing", () => {
    const options = makeOptions({ template: "direktorat", defaultTemplateArgs: undefined });

    expect(() => resolveTemplate("direktorat")!.getMd("# Body", options)).toThrow(
      /expected object/i,
    );
  });
});

describe("blank template registry", () => {
  test("resolves the blank template by name", () => {
    expect(resolveTemplate("blank")?.name).toBe("blank");
  });

  test("leaves the body markdown unchanged", () => {
    const options = makeOptions({ template: "blank", defaultTemplateArgs: undefined });

    expect(resolveTemplate("blank")!.getMd("# Body", options)).toBe("# Body");
  });

  test("uses the blank template css without a header/footer", () => {
    const options = makeOptions({ template: "blank", defaultTemplateArgs: undefined });
    const pdfConfig = resolveTemplate("blank")!.getPdfConfig(options);

    expect(pdfConfig.css).toBe(blankTemplate.globalCss);
    expect(pdfConfig.pdf_options?.displayHeaderFooter).toBeUndefined();
    expect(pdfConfig.pdf_options?.margin).toBeDefined();
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
