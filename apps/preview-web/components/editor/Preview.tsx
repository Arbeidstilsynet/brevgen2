"use client";

import { genererPdf } from "@/actions/pdf";
import { useDebouncedMutation } from "@/hooks/useDebouncedMutation";
import { defaultTemplate } from "@at/document-templates";
import { marked } from "marked";
import { useEffect, useRef, useState } from "react";
import sanitizeHtml from "sanitize-html";
import { HandlerGeneratePdfArgs } from "../../../api/function/handler";
import { TemplateOption } from "./TemplatePicker";

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
  activePreviewTab: string;
  md: string;
  parsedMd: string;
  mdVariables: Record<string, string | boolean>;
  selectedTemplate: TemplateOption;
  defaultTemplateArgs: defaultTemplate.DefaultTemplateArgs;
}>;

export function Preview({
  activePreviewTab,
  parsedMd,
  md,
  mdVariables,
  selectedTemplate,
  defaultTemplateArgs,
}: Props) {
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const previousValues = useRef({
    md,
    mdVariables,
    selectedTemplate,
    defaultTemplateArgs,
  });
  const pdfUrlRef = useRef<string | null>(null);

  const {
    debouncedMutate,
    data: pdfUrl,
    error: pdfError,
  } = useDebouncedMutation({
    mutationKey: ["generate"],
    mutationFn: async (payload: HandlerGeneratePdfArgs) => {
      const base64Pdf = await genererPdf(payload);
      const buffer = Buffer.from(base64Pdf, "base64");
      const blob = new Blob([buffer], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    },
    onSuccess: (url) => {
      pdfUrlRef.current = url;
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
    } = previousValues.current;
    if (
      prevMd === md &&
      prevMdVariables === mdVariables &&
      prevTemplate === selectedTemplate &&
      prevTemplateArgs === defaultTemplateArgs &&
      pdfUrlRef.current // don't skip if this is first render
    ) {
      return;
    }

    previousValues.current = {
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
    } satisfies HandlerGeneratePdfArgs;

    debouncedMutate(payload, {
      debounceMs: 1000,
    });
  }, [activePreviewTab, debouncedMutate, defaultTemplateArgs, md, mdVariables, selectedTemplate]);

  useEffect(() => {
    if (activePreviewTab !== "html") {
      return;
    }

    const renderHtml = () => {
      let md = parsedMd;

      if (selectedTemplate === "default") {
        md = defaultTemplate.getMd(md, defaultTemplateArgs);
      }

      const output = getHtml(md, selectedTemplate === "default" ? defaultTemplate.globalCss : "");
      setRenderedHtml(output);
    };

    renderHtml();
  }, [activePreviewTab, defaultTemplateArgs, parsedMd, selectedTemplate]);

  if (activePreviewTab === "markdown") {
    return <pre className="whitespace-pre-wrap">{parsedMd}</pre>;
  }

  if (activePreviewTab === "html") {
    return (
      <iframe
        title="HTML preview"
        srcDoc={renderedHtml ?? ""}
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
    <div className="fixed top-12 right-2 max-w-[calc(40%-20px)] bg-red-800 text-white p-2 rounded z-50 break-words">
      {error.message}
    </div>
  );
}
