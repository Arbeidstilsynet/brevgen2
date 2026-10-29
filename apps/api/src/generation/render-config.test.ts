import { resolveTemplate } from "@at/document-templates";
import type { GenerateDocumentRequestOptions } from "@repo/shared-types";
import { describe, expect, test } from "vitest";
import { resolveRenderConfig } from "./render-config";

// Characterisation harness: the config the renderer receives, after every merge and normalisation
// step. Only this block may change when the resolution is refactored.
async function effectiveRenderConfig(options: GenerateDocumentRequestOptions): Promise<unknown> {
  return resolveRenderConfig(options);
}
// End of characterisation harness.

const rendererDefaults = {
  css: "",
  merge_css: false,
  document_title: "",
  page_media_type: "screen",
  as_html: false,
};
const rendererDefaultPdfOptions = {
  printBackground: true,
  format: "a4",
  margin: { top: "30mm", right: "40mm", bottom: "30mm", left: "20mm" },
};
const templateMargin = { top: "0.5in", right: "1.2in", bottom: "1.2in", left: "1.2in" };

const virksomhet = { navn: "Test AS", adresse: "Testveien 1", postnr: "1234", poststed: "Oslo" };
const defaultDynamic: GenerateDocumentRequestOptions["dynamic"] = {
  template: "default",
  defaultTemplateArgs: {
    language: "bm",
    signatureVariant: "automatiskBehandlet",
    fields: { dato: "01.01.2030", saksnummer: "2030/1", saksbehandlerNavn: "Test", virksomhet },
  },
};
const direktoratDynamic: GenerateDocumentRequestOptions["dynamic"] = {
  template: "direktorat",
  direktoratTemplateArgs: {
    language: "bm",
    signatureVariant: "usignert",
    fields: {
      dato: "01.01.2030",
      saksnummer: "2030/1",
      saksbehandlerNavn: "Test",
      mottaker: virksomhet,
    },
  },
};

/** The template's own css and footer are opaque here; their content is pinned by visual tests. */
function templateParts(options: GenerateDocumentRequestOptions) {
  const config = resolveTemplate(options.dynamic.template)!.getPdfConfig(options);
  return { css: config.css, footerTemplate: config.pdf_options?.footerTemplate };
}

describe("effective render config", () => {
  describe("templates", () => {
    test.each([
      ["default", defaultDynamic],
      ["direktorat", direktoratDynamic],
    ])("%s template adds its css, footer and margins", async (_name, dynamic) => {
      const options = { dynamic };
      const { css, footerTemplate } = templateParts(options);

      expect(await effectiveRenderConfig(options)).toStrictEqual({
        ...rendererDefaults,
        css,
        dynamic,
        pdf_options: {
          ...rendererDefaultPdfOptions,
          displayHeaderFooter: true,
          headerTemplate: "<div></div>",
          footerTemplate,
          margin: templateMargin,
        },
      });
    });

    test("blank template adds its css and margins without header or footer", async () => {
      const dynamic = { template: "blank" as const };

      expect(await effectiveRenderConfig({ dynamic })).toStrictEqual({
        ...rendererDefaults,
        css: templateParts({ dynamic }).css,
        dynamic,
        pdf_options: { ...rendererDefaultPdfOptions, margin: templateMargin },
      });
    });

    test("custom template uses renderer defaults only", async () => {
      const dynamic = { template: "custom" as const };

      expect(await effectiveRenderConfig({ dynamic })).toStrictEqual({
        ...rendererDefaults,
        dynamic,
        pdf_options: rendererDefaultPdfOptions,
      });
    });

    test("custom template takes caller options over renderer defaults", async () => {
      const callerOptions = {
        dynamic: { template: "custom" as const },
        css: "p { color: red; }",
        document_title: "Tittel",
        page_media_type: "print" as const,
        author: "Arbeidstilsynet",
        pdf_options: { landscape: true, margin: { top: "1cm" } },
      };

      expect(await effectiveRenderConfig(callerOptions)).toStrictEqual({
        ...rendererDefaults,
        ...callerOptions,
        pdf_options: { ...rendererDefaultPdfOptions, landscape: true, margin: { top: "1cm" } },
      });
    });
  });

  describe("pdf_options", () => {
    test("caller pdf_options shallow-merge over template pdf_options", async () => {
      const callerOptions = {
        dynamic: defaultDynamic,
        pdf_options: { landscape: true, margin: { top: "1cm" } },
      };
      const { css, footerTemplate } = templateParts(callerOptions);

      expect(await effectiveRenderConfig(callerOptions)).toStrictEqual({
        ...rendererDefaults,
        css,
        dynamic: defaultDynamic,
        pdf_options: {
          ...rendererDefaultPdfOptions,
          displayHeaderFooter: true,
          headerTemplate: "<div></div>",
          footerTemplate,
          landscape: true,
          margin: { top: "1cm" },
        },
      });
    });

    test("caller footerTemplate replaces the template footer", async () => {
      const callerOptions = { dynamic: defaultDynamic, pdf_options: { footerTemplate: "<p/>" } };

      expect(await effectiveRenderConfig(callerOptions)).toMatchObject({
        pdf_options: { displayHeaderFooter: true, footerTemplate: "<p/>", margin: templateMargin },
      });
    });
  });

  describe("css", () => {
    test("merge_css appends caller css to template css", async () => {
      const callerOptions = { dynamic: defaultDynamic, merge_css: true, css: "p { color: red; }" };
      const { css } = templateParts(callerOptions);

      expect(await effectiveRenderConfig(callerOptions)).toMatchObject({
        merge_css: true,
        css: `${css}\np { color: red; }`,
      });
    });

    test("without merge_css, caller css replaces template css", async () => {
      const callerOptions = { dynamic: defaultDynamic, merge_css: false, css: "p { color: red; }" };

      expect(await effectiveRenderConfig(callerOptions)).toMatchObject({
        merge_css: false,
        css: "p { color: red; }",
      });
    });

    test("merge_css on the custom template keeps only caller css", async () => {
      const callerOptions = {
        dynamic: { template: "custom" as const },
        merge_css: true,
        css: "p { color: red; }",
      };

      expect(await effectiveRenderConfig(callerOptions)).toMatchObject({
        merge_css: true,
        css: "p { color: red; }",
      });
    });
  });

  describe("as_html", () => {
    test("as_html is passed through and pdf_options are still resolved", async () => {
      const dynamic = { template: "blank" as const };

      expect(await effectiveRenderConfig({ dynamic, as_html: true })).toStrictEqual({
        ...rendererDefaults,
        as_html: true,
        css: templateParts({ dynamic }).css,
        dynamic,
        pdf_options: { ...rendererDefaultPdfOptions, margin: templateMargin },
      });
    });
  });

  describe("margin", () => {
    // The request schema only accepts margin objects; strings can only come from internal callers.
    test.each([
      ["1cm", { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" }],
      ["1cm 2cm", { top: "1cm", right: "2cm", bottom: "1cm", left: "2cm" }],
      ["1cm 2cm 3cm", { top: "1cm", right: "2cm", bottom: "3cm", left: "2cm" }],
      ["1cm 2cm 3cm 4cm", { top: "1cm", right: "2cm", bottom: "3cm", left: "4cm" }],
      ["", undefined],
    ])("margin string %j becomes %j", async (margin, expected) => {
      const config = await effectiveRenderConfig(customWithPdfOptions({ margin }));

      expect(config).toHaveProperty("pdf_options.margin");
      expect((config as { pdf_options: { margin: unknown } }).pdf_options.margin).toStrictEqual(
        expected,
      );
    });

    test("margin string with more than four values is rejected", async () => {
      await expect(
        effectiveRenderConfig(customWithPdfOptions({ margin: "1 2 3 4 5" })),
      ).rejects.toThrow('invalid margin input "1 2 3 4 5": can have max 4 values.');
    });

    test("margin object is passed through unchanged", async () => {
      expect(
        await effectiveRenderConfig(customWithPdfOptions({ margin: { left: "5mm" } })),
      ).toMatchObject({ pdf_options: { margin: { left: "5mm" } } });
    });
  });

  describe("displayHeaderFooter", () => {
    test.each([
      ["headerTemplate", { headerTemplate: "<p/>" }],
      ["footerTemplate", { footerTemplate: "<p/>" }],
    ])("is enabled when %s is set and displayHeaderFooter is unset", async (_name, pdfOptions) => {
      expect(await effectiveRenderConfig(customWithPdfOptions(pdfOptions))).toMatchObject({
        pdf_options: { ...pdfOptions, displayHeaderFooter: true },
      });
    });

    test("stays false when explicitly disabled alongside a footer", async () => {
      expect(
        await effectiveRenderConfig(
          customWithPdfOptions({ footerTemplate: "<p/>", displayHeaderFooter: false }),
        ),
      ).toMatchObject({ pdf_options: { footerTemplate: "<p/>", displayHeaderFooter: false } });
    });

    test("caller can disable the template footer", async () => {
      expect(
        await effectiveRenderConfig({
          dynamic: defaultDynamic,
          pdf_options: { displayHeaderFooter: false },
        }),
      ).toMatchObject({ pdf_options: { displayHeaderFooter: false } });
    });

    test("is enabled when a caller footer is added to the blank template", async () => {
      expect(
        await effectiveRenderConfig({
          dynamic: { template: "blank" },
          pdf_options: { footerTemplate: "<p/>" },
        }),
      ).toMatchObject({
        pdf_options: { footerTemplate: "<p/>", displayHeaderFooter: true, margin: templateMargin },
      });
    });

    test("is not added when there is no header or footer", async () => {
      const config = await effectiveRenderConfig({ dynamic: { template: "custom" } });

      expect(config).not.toHaveProperty("pdf_options.displayHeaderFooter");
    });
  });

  describe("absent vs explicitly undefined caller options", () => {
    test("explicitly undefined css overrides both template and renderer css", async () => {
      expect(
        await effectiveRenderConfig({ dynamic: defaultDynamic, css: undefined }),
      ).toHaveProperty("css", undefined);
    });

    test("explicitly undefined pdf_options drops the template pdf_options", async () => {
      const config = await effectiveRenderConfig({
        dynamic: defaultDynamic,
        pdf_options: undefined,
      });

      expect(config).toHaveProperty("pdf_options", rendererDefaultPdfOptions);
    });

    test("explicitly undefined as_html overrides the renderer default", async () => {
      const config = await effectiveRenderConfig({
        dynamic: { template: "custom" },
        as_html: undefined,
      });

      expect(config).toHaveProperty("as_html", undefined);
    });
  });

  describe("isolation", () => {
    test("does not mutate caller options", async () => {
      const callerOptions = deepFreeze(
        customWithPdfOptions({ footerTemplate: "<p/>", margin: "1cm" }),
      );

      await expect(effectiveRenderConfig(callerOptions)).resolves.toBeDefined();
    });

    test("does not leak normalisation into later requests", async () => {
      await effectiveRenderConfig({
        dynamic: { template: "blank" },
        pdf_options: { footerTemplate: "<p/>" },
      });

      const config = await effectiveRenderConfig({ dynamic: { template: "blank" } });

      expect(config).not.toHaveProperty("pdf_options.displayHeaderFooter");
      expect(config).toHaveProperty("pdf_options.margin", templateMargin);
    });
  });
});

function customWithPdfOptions(pdfOptions: Record<string, unknown>): GenerateDocumentRequestOptions {
  return {
    dynamic: { template: "custom" },
    pdf_options: pdfOptions,
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
