import type {
  DefaultTemplateArgs,
  DirektoratTemplateArgs,
  DocumentTemplateOption,
  GenerateDocumentRequest,
  PDFOptionsWithLimits,
} from "@repo/shared-types";

export type PreviewRequestMode = "pdf" | "html";

export type PreviewRequestState = Readonly<{
  md: string;
  mdVariables: Record<string, string | boolean>;
  selectedTemplate: DocumentTemplateOption;
  defaultTemplateArgs: DefaultTemplateArgs;
  direktoratTemplateArgs: DirektoratTemplateArgs;
  pdfOptions: PDFOptionsWithLimits;
}>;

export function buildPreviewRequest(
  state: PreviewRequestState,
  mode: PreviewRequestMode,
): GenerateDocumentRequest {
  const dynamic = {
    template: state.selectedTemplate,
    defaultTemplateArgs:
      state.selectedTemplate === "default" ? state.defaultTemplateArgs : undefined,
    direktoratTemplateArgs:
      state.selectedTemplate === "direktorat" ? state.direktoratTemplateArgs : undefined,
  };

  if (mode === "html") {
    return {
      md: state.md,
      mdVariables: state.mdVariables,
      options: {
        document_title: "Preview",
        dynamic,
        as_html: true,
      },
    };
  }

  return {
    md: state.md,
    mdVariables: state.mdVariables,
    options: {
      document_title: "Preview",
      author: "Brevgen2 Editor",
      dynamic,
      ...(Object.keys(state.pdfOptions).length > 0 ? { pdf_options: state.pdfOptions } : {}),
    },
  };
}
