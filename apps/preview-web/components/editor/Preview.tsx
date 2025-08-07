"use client";

import { sendGenerateDocument } from "@/actions/pdf";
import { useDebouncedMutation } from "@/hooks/useDebouncedMutation";
import { defaultTemplate } from "@at/document-templates";
import type {
  DefaultTemplateArgs,
  DocumentTemplateOption,
  GenerateDocumentRequest,
} from "@repo/shared-types";
import { marked } from "marked";
import { useEffect, useRef, useState } from "react";
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

type Props = Readonly<{
  activePreviewTab: ActivePreviewTab;
  md: string;
  parsedMd: string;
  mdVariables: Record<string, string | boolean>;
  selectedTemplate: DocumentTemplateOption;
  defaultTemplateArgs: DefaultTemplateArgs;
}>;

export function Preview({
  activePreviewTab,
  parsedMd,
  md,
  mdVariables,
  selectedTemplate,
  defaultTemplateArgs,
}: Props) {
  const [localHtml, setLocalHtml] = useState<string | null>(null);

  // refs for storing pevious request payloads and results
  // used for proper (re)request behavior on tab switching
  const previousPdfValues = useRef({
    md,
    mdVariables,
    selectedTemplate,
    defaultTemplateArgs,
  });
  const previousHtmlValues = useRef({
    md,
    mdVariables,
    selectedTemplate,
    defaultTemplateArgs,
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

  useEffect(() => {
    if (activePreviewTab !== "pdf") {
      return;
    }

    // Check if any of the values have changed since the last render
    const {
      md: prevMd,
      mdVariables: prevMdVariables,
      selectedTemplate: prevTemplate,
      defaultTemplateArgs: prevTemplateArgs,
    } = previousPdfValues.current;
    if (
      prevMd === md &&
      prevMdVariables === mdVariables &&
      prevTemplate === selectedTemplate &&
      prevTemplateArgs === defaultTemplateArgs &&
      pdfUrlRef.current // don't skip if this is first render
    ) {
      return;
    }

    previousPdfValues.current = {
      md,
      mdVariables,
      selectedTemplate,
      defaultTemplateArgs,
    };

    const payload = {
      md,
      mdVariables,
      options: {
        document_title: "Brev fra Arbeidstilsynet",
        author: "Arbeidstilsynet",
        dynamic: {
          template: selectedTemplate,
          defaultTemplateArgs: selectedTemplate === "default" ? defaultTemplateArgs : undefined,
        },
      },
    } satisfies GenerateDocumentRequest;

    debouncedMutatePdf(payload, {
      debounceMs: 1000,
    });
  }, [
    activePreviewTab,
    debouncedMutatePdf,
    defaultTemplateArgs,
    md,
    mdVariables,
    selectedTemplate,
  ]);

  useEffect(() => {
    if (activePreviewTab !== "html-remote") {
      return;
    }

    // Check if any of the values have changed since the last render
    const {
      md: prevMd,
      mdVariables: prevMdVariables,
      selectedTemplate: prevTemplate,
      defaultTemplateArgs: prevTemplateArgs,
    } = previousHtmlValues.current;
    if (
      prevMd === md &&
      prevMdVariables === mdVariables &&
      prevTemplate === selectedTemplate &&
      prevTemplateArgs === defaultTemplateArgs &&
      remoteHtmlRef.current // don't skip if this is first render
    ) {
      return;
    }

    previousHtmlValues.current = {
      md,
      mdVariables,
      selectedTemplate,
      defaultTemplateArgs,
    };

    const payload = {
      md,
      mdVariables,
      options: {
        document_title: "Brev fra Arbeidstilsynet",
        dynamic: {
          template: selectedTemplate,
          defaultTemplateArgs: selectedTemplate === "default" ? defaultTemplateArgs : undefined,
        },
        as_html: true,
      },
    } satisfies GenerateDocumentRequest;

    debouncedMutateHtml(payload, {
      debounceMs: 1000,
    });
  }, [
    activePreviewTab,
    debouncedMutateHtml,
    defaultTemplateArgs,
    md,
    mdVariables,
    selectedTemplate,
  ]);

  useEffect(() => {
    if (activePreviewTab !== "html") {
      return;
    }

    const renderHtml = () => {
      let md = parsedMd;

      if (selectedTemplate === "default") {
        md = defaultTemplate.getMd(md, defaultTemplateArgs);
      }

      const css =
        selectedTemplate === "default" || selectedTemplate === "blank"
          ? defaultTemplate.globalCss
          : "";
      const output = getHtml(md, css);
      setLocalHtml(output);
    };

    renderHtml();
  }, [activePreviewTab, defaultTemplateArgs, parsedMd, selectedTemplate]);

  if (activePreviewTab === "md") {
    return <pre className="whitespace-pre-wrap">{parsedMd}</pre>;
  }

  if (activePreviewTab === "html") {
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
    <div className="fixed top-12 right-2 max-w-[calc(40%-20px)] bg-red-800 text-white p-2 rounded-sm z-50 break-words">
      {error.message}
    </div>
  );
}
