import type { DefaultTemplateArgs, DirektoratTemplateArgs } from "@repo/shared-types";
import { describe, expect, it } from "vitest";
import {
  buildPreviewRequest,
  type PreviewRequestMode,
  type PreviewRequestState,
} from "./buildPreviewRequest";

const defaultTemplateArgs: DefaultTemplateArgs = {
  language: "bm",
  signatureVariant: "elektroniskGodkjent",
  fields: {
    dato: "2026-06-09",
    saksnummer: "2026/123",
    saksbehandlerNavn: "Ola Saksbehandler",
    virksomhet: {
      navn: "Eksempel AS",
      adresse: "Arbeidsveien 1",
      postnr: "0123",
      poststed: "Oslo",
    },
  },
};

const direktoratTemplateArgs: DirektoratTemplateArgs = {
  language: "bm",
  signatureVariant: "usignert",
  fields: {
    dato: "2026-06-09",
    saksnummer: "2026/456",
    saksbehandlerNavn: "Kari Saksbehandler",
  },
};

const baseState: PreviewRequestState = {
  md: "# Content template",
  mdVariables: {
    includeDetails: true,
    recipient: "Eksempel AS",
  },
  selectedTemplate: "default",
  defaultTemplateArgs,
  direktoratTemplateArgs,
  pdfOptions: {
    format: "A4",
  },
};

describe("buildPreviewRequest", () => {
  it("builds a PDF preview request for the default document template", () => {
    expect(buildPreviewRequest(baseState, "pdf")).toEqual({
      md: "# Content template",
      mdVariables: {
        includeDetails: true,
        recipient: "Eksempel AS",
      },
      options: {
        document_title: "Preview",
        author: "Brevgen2 Editor",
        dynamic: {
          template: "default",
          defaultTemplateArgs,
          direktoratTemplateArgs: undefined,
        },
        pdf_options: {
          format: "A4",
        },
      },
    });
  });

  it("builds a remote HTML preview request for the default document template", () => {
    expect(buildPreviewRequest(baseState, "html")).toEqual({
      md: "# Content template",
      mdVariables: {
        includeDetails: true,
        recipient: "Eksempel AS",
      },
      options: {
        document_title: "Preview",
        dynamic: {
          template: "default",
          defaultTemplateArgs,
          direktoratTemplateArgs: undefined,
        },
        as_html: true,
      },
    });
  });

  it.each(["pdf", "html"] satisfies PreviewRequestMode[])(
    "includes only the selected document template args in %s mode",
    (mode) => {
      expect(
        buildPreviewRequest({ ...baseState, selectedTemplate: "direktorat" }, mode).options.dynamic,
      ).toEqual({
        template: "direktorat",
        defaultTemplateArgs: undefined,
        direktoratTemplateArgs,
      });

      expect(
        buildPreviewRequest({ ...baseState, selectedTemplate: "blank" }, mode).options.dynamic,
      ).toEqual({
        template: "blank",
        defaultTemplateArgs: undefined,
        direktoratTemplateArgs: undefined,
      });
    },
  );

  it("omits PDF options from PDF preview requests when none are configured", () => {
    const request = buildPreviewRequest({ ...baseState, pdfOptions: {} }, "pdf");

    expect(request.options).not.toHaveProperty("pdf_options");
  });
});
