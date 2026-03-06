"use client";

import { sendGenerateDocument } from "@/actions/pdf";
import { useDebouncedMutation } from "@/hooks/useDebouncedMutation";
import { defaultTemplate, direktoratTemplate } from "@at/document-templates";
import type {
  DefaultTemplateArgs,
  DirektoratTemplateArgs,
  DocumentTemplateOption,
  GenerateDocumentRequest,
  PDFOptionsWithLimits,
} from "@repo/shared-types";
import { marked } from "marked";
import { useEffect, useRef } from "react";
import sanitizeHtml from "sanitize-html";
import { ActivePreviewTab } from "./header/PreviewControls";

function getHtml(md: string, css: string) {
  const dirty = marked(md) as string;
  const clean = sanitizeHtml(dirty, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "html", "head", "body"]),
    allowedAttributes: false,
    allowedSchemesByTag: {
      img: ["data"],
      a: ["http", "https", "mailto", "relative"],
    },
  });

  return `
    <html>
	<head>
  <style>${css}</style>
  </head>
	<body>
		${clean}
    </body>
</html>
`;
}

function renderHtml(
  md: string,
  selectedTemplate: DocumentTemplateOption,
  defaultTemplateArgs: DefaultTemplateArgs,
  direktoratTemplateArgs: DirektoratTemplateArgs,
) {
  if (selectedTemplate === "default") {
    md = defaultTemplate.getMd(md, defaultTemplateArgs);
  }

  if (selectedTemplate === "direktorat") {
    md = direktoratTemplate.getMd(md, direktoratTemplateArgs);
  }

  const css = ["default", "blank", "direktorat"].includes(selectedTemplate)
    ? defaultTemplate.globalCss
    : "";
  return getHtml(md, css);
}

type Props = Readonly<{
  activePreviewTab: ActivePreviewTab;
  md: string;
  parsedMd: string;
  mdVariables: Record<string, string | boolean>;
  selectedTemplate: DocumentTemplateOption;
  defaultTemplateArgs: DefaultTemplateArgs;
  direktoratTemplateArgs: DirektoratTemplateArgs;
  hasParseError: boolean;
  pdfOptions: PDFOptionsWithLimits;
}>;

export function Preview({
  activePreviewTab,
  parsedMd,
  md,
  mdVariables,
  selectedTemplate,
  defaultTemplateArgs,
  direktoratTemplateArgs,
  hasParseError,
  pdfOptions,
}: Props) {
  // refs for storing pevious request payloads and results
  // used for proper (re)request behavior on tab switching
  const previousPdfValues = useRef({
    pdfOptions,
  });
  const previousHtmlValues = useRef({
    md,
    mdVariables,
    selectedTemplate,
    defaultTemplateArgs,
    direktoratTemplateArgs,
  });
  const pdfUrlRef = useRef<string | null>(null);
  const remoteHtmlRef = useRef<string | null>(null);

  const {
    debouncedMutate: debouncedMutatePdf,
    data: pdfUrl,
    error: pdfError,
  } = useDebouncedMutation({
    mutationKey: ["generate"],
    mutationFn: async (payload: GenerateDocumentRequest) => {
      const base64Pdf = await sendGenerateDocument(payload);
      const buffer = Buffer.from(base64Pdf, "base64");
      const blob = new Blob([buffer], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    },
    onSuccess: (data) => {
      pdfUrlRef.current = data;
    },
  });

  const {
    debouncedMutate: debouncedMutateHtml,
    data: renderedRemoteHtml,
    error: htmlError,
  } = useDebouncedMutation({
    mutationKey: ["generate-html"],
    mutationFn: async (payload: GenerateDocumentRequest) => await sendGenerateDocument(payload),
    onSuccess: (data) => {
      remoteHtmlRef.current = data;
    },
  });

  // These effects are a hack to handle debounced mutations with changing payloads.
  // e.g. when switching tabs it should only re-render if the payload has changed since last render..
  // To ditch the effects requires a major refactor of state handling
  // so the queries trigger in the tab/payload-changing event handlers.
  useEffect(() => {
    if (activePreviewTab !== "pdf" || hasParseError) {
      return;
    }

    // Check if any of the payload values have changed since the last render
    if (
      previousHtmlValues.current.md === md &&
      previousHtmlValues.current.mdVariables === mdVariables &&
      previousHtmlValues.current.selectedTemplate === selectedTemplate &&
      previousHtmlValues.current.defaultTemplateArgs === defaultTemplateArgs &&
      previousHtmlValues.current.direktoratTemplateArgs === direktoratTemplateArgs &&
      previousPdfValues.current.pdfOptions === pdfOptions &&
      pdfUrlRef.current // don't skip if this is first render
    ) {
      return;
    }

    previousPdfValues.current = {
      pdfOptions,
    };
    previousHtmlValues.current = {
      md,
      mdVariables,
      selectedTemplate,
      defaultTemplateArgs,
      direktoratTemplateArgs,
    };

    const payload = {
      md,
      mdVariables,
      options: {
        document_title: "Preview",
        author: "Brevgen2 Editor",
        dynamic: {
          template: selectedTemplate,
          defaultTemplateArgs: selectedTemplate === "default" ? defaultTemplateArgs : undefined,
          direktoratTemplateArgs:
            selectedTemplate === "direktorat" ? direktoratTemplateArgs : undefined,
        },
        pdf_options: Object.keys(pdfOptions).length > 0 ? pdfOptions : undefined,
      },
    } satisfies GenerateDocumentRequest;

    debouncedMutatePdf(payload, { debounceMs: 1000 });
  }, [
    activePreviewTab,
    debouncedMutatePdf,
    defaultTemplateArgs,
    direktoratTemplateArgs,
    hasParseError,
    md,
    mdVariables,
    pdfOptions,
    selectedTemplate,
  ]);

  useEffect(() => {
    if (activePreviewTab !== "html-remote" || hasParseError) {
      return;
    }

    // Check if any of the payload values have changed since the last render
    if (
      previousHtmlValues.current.md === md &&
      previousHtmlValues.current.mdVariables === mdVariables &&
      previousHtmlValues.current.selectedTemplate === selectedTemplate &&
      previousHtmlValues.current.defaultTemplateArgs === defaultTemplateArgs &&
      previousHtmlValues.current.direktoratTemplateArgs === direktoratTemplateArgs &&
      remoteHtmlRef.current // don't skip if this is first render
    ) {
      return;
    }

    previousHtmlValues.current = {
      md,
      mdVariables,
      selectedTemplate,
      defaultTemplateArgs,
      direktoratTemplateArgs,
    };

    const payload = {
      md,
      mdVariables,
      options: {
        document_title: "Preview",
        dynamic: {
          template: selectedTemplate,
          defaultTemplateArgs: selectedTemplate === "default" ? defaultTemplateArgs : undefined,
          direktoratTemplateArgs:
            selectedTemplate === "direktorat" ? direktoratTemplateArgs : undefined,
        },
        as_html: true,
      },
    } satisfies GenerateDocumentRequest;

    debouncedMutateHtml(payload, { debounceMs: 1000 });
  }, [
    activePreviewTab,
    debouncedMutateHtml,
    defaultTemplateArgs,
    direktoratTemplateArgs,
    hasParseError,
    md,
    mdVariables,
    selectedTemplate,
  ]);

  if (activePreviewTab === "md") {
    return <pre className="whitespace-pre-wrap">{parsedMd}</pre>;
  }

  if (activePreviewTab === "html") {
    const localHtml = renderHtml(
      parsedMd,
      selectedTemplate,
      defaultTemplateArgs,
      direktoratTemplateArgs,
    );
    return (
      <iframe
        title="HTML preview"
        srcDoc={localHtml ?? ""}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    );
  }

  if (activePreviewTab === "html-remote") {
    if (!renderedRemoteHtml) {
      if (hasParseError) {
        return <pre className="whitespace-pre-wrap">Parse error</pre>;
      }
      return (
        <>
          {htmlError && <ErrorOverlay error={htmlError} />}
          <pre className="whitespace-pre-wrap break-all">Generating...</pre>
        </>
      );
    }
    return (
      <iframe
        title="HTML preview"
        srcDoc={renderedRemoteHtml ?? ""}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    );
  }

  if (activePreviewTab === "pdf") {
    if (!pdfUrl) {
      if (hasParseError) {
        return <pre className="whitespace-pre-wrap">Parse error</pre>;
      }
      return (
        <>
          {pdfError && <ErrorOverlay error={pdfError} />}
          <pre className="whitespace-pre-wrap break-all">Generating...</pre>
        </>
      );
    }
    return (
      <>
        {pdfError && <ErrorOverlay error={pdfError} />}
        <iframe
          title="PDF preview"
          src={pdfUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
        ;
      </>
    );
  }
}

function ErrorOverlay({ error }: Readonly<{ error: Error | null }>) {
  if (!error) return null;
  console.error(error);
  return (
    <div className="fixed top-12 right-2 max-w-[calc(40%-20px)] bg-red-800 text-white p-2 rounded-sm z-50 wrap-break-word">
      {error.message}
    </div>
  );
}
