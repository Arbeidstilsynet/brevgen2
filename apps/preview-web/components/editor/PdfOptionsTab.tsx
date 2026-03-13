"use client";

import type { PDFOptionsWithLimits } from "@repo/shared-types";
import { useState } from "react";
import { ActionButton } from "../buttons";
import { useToast } from "../toast/provider";
import { parseJsonFromClipboard, parsePossiblySerializedJson } from "./utils";

type PdfOptionsTabProps = Readonly<{
  pdfOptions: PDFOptionsWithLimits;
  setPdfOptions: (options: PDFOptionsWithLimits) => void;
}>;

const paperFormats = [
  "letter",
  "legal",
  "tabloid",
  "ledger",
  "a0",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
] as const;

// All valid PDF option keys
const ALLOWED_PDF_OPTION_KEYS = new Set<string>([
  "scale",
  "displayHeaderFooter",
  "headerTemplate",
  "footerTemplate",
  "printBackground",
  "landscape",
  "pageRanges",
  "format",
  "width",
  "height",
  "preferCSSPageSize",
  "margin",
  "omitBackground",
  "tagged",
  "outline",
]);

function isAllowedPdfOptionsKey(key: string): key is Extract<keyof PDFOptionsWithLimits, string> {
  return ALLOWED_PDF_OPTION_KEYS.has(key);
}

function filterAllowedPdfOptions(obj: unknown): PDFOptionsWithLimits | null {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return null;
  }

  const filtered = {} as Record<string, unknown>;
  let keyCount = 0;

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (isAllowedPdfOptionsKey(key)) {
      filtered[key] = value;
      keyCount++;
    }
  }

  return keyCount > 0 ? (filtered as PDFOptionsWithLimits) : null;
}

export function PdfOptionsTab({ pdfOptions, setPdfOptions }: PdfOptionsTabProps) {
  const { addToast } = useToast();
  const [jsonInput, setJsonInput] = useState("");

  const updateOption = <K extends keyof PDFOptionsWithLimits>(
    key: K,
    value: PDFOptionsWithLimits[K],
  ) => {
    setPdfOptions({ ...pdfOptions, [key]: value });
  };

  const handleReset = () => {
    setPdfOptions({});
    addToast("info", "PDF options reset to defaults");
  };

  const handleCopyToClipboard = async () => {
    await navigator.clipboard.writeText(JSON.stringify(pdfOptions, null, 2));
    addToast("info", "Copied PDF options to clipboard");
  };

  const handlePasteFromClipboard = async () => {
    const filtered = await parseJsonFromClipboard<PDFOptionsWithLimits>(
      ALLOWED_PDF_OPTION_KEYS,
      isAllowedPdfOptionsKey,
      "Clipboard access unavailable. Paste JSON here to fill options.",
      addToast,
    );

    if (filtered) {
      const keyCount = Object.keys(filtered).length;
      setPdfOptions(filtered);
      addToast("success", `Applied ${keyCount} PDF option${keyCount > 1 ? "s" : ""}`);
    }
  };

  const handleApplyJson = () => {
    const parsed = parsePossiblySerializedJson(jsonInput);
    if (parsed === undefined) {
      addToast("error", "Failed to parse JSON");
      return;
    }

    const filtered = filterAllowedPdfOptions(parsed);
    if (!filtered) {
      addToast("warning", "No valid PDF options found in provided JSON");
      return;
    }

    const keyCount = Object.keys(filtered).length;
    setPdfOptions(filtered);
    setJsonInput("");
    addToast("success", `Applied ${keyCount} PDF option${keyCount > 1 ? "s" : ""}`);
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="top-0 z-10 bg-gray-100 pb-2 mb-2">
        <div className="flex flex-wrap gap-2">
          <ActionButton variant="neutral" size="sm" onClick={handleReset}>
            Reset
          </ActionButton>
          <ActionButton variant="neutral" size="sm" onClick={handlePasteFromClipboard}>
            Paste from clipboard
          </ActionButton>
          <ActionButton variant="neutral" size="sm" onClick={handleCopyToClipboard}>
            Copy to clipboard
          </ActionButton>
        </div>
      </div>

      <div className="space-y-4">
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-gray-900 p-4 mb-4"
          role="alert"
        >
          <b>Note:</b> These options override default settings.
        </div>

        {/* Scale */}
        <div className="bg-white p-3 rounded border">
          <label className="block text-sm font-medium mb-2">
            Scale: {pdfOptions.scale ?? 1}
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={pdfOptions.scale ?? 1}
              onChange={(e) => updateOption("scale", Number.parseFloat(e.target.value))}
              className="mt-1 block w-full"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">Scale of the webpage rendering (0.1 - 2)</p>
        </div>

        {/* Boolean Options */}
        {(
          [
            { key: "displayHeaderFooter", label: "Display Header/Footer" },
            { key: "printBackground", label: "Print Background" },
            { key: "landscape", label: "Landscape Orientation" },
            { key: "preferCSSPageSize", label: "Prefer CSS Page Size" },
            { key: "omitBackground", label: "Omit Background" },
            { key: "tagged", label: "Tagged PDF" },
            { key: "outline", label: "Generate Outline" },
          ] as const
        ).map(({ key, label }) => (
          <div key={key} className="bg-white p-3 rounded border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(pdfOptions[key])}
                onChange={(e) => updateOption(key, e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">{label}</span>
            </label>
          </div>
        ))}

        {/* Paper Format */}
        <div className="bg-white p-3 rounded border">
          <label className="block text-sm font-medium mb-2">
            Paper Format
            <select
              value={(pdfOptions.format as string) ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                updateOption(
                  "format",
                  value === "" ? undefined : (value as (typeof paperFormats)[number]),
                );
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Default</option>
              {paperFormats.map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Width and Height */}
        <div className="bg-white p-3 rounded border">
          <label className="block text-sm font-medium mb-2">
            Width
            <input
              type="text"
              value={pdfOptions.width ?? ""}
              onChange={(e) => updateOption("width", e.target.value)}
              placeholder="e.g., 8.5in or 210mm"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">Paper width (e.g., 8.5in, 210mm)</p>
        </div>

        <div className="bg-white p-3 rounded border">
          <label className="block text-sm font-medium mb-2">
            Height
            <input
              type="text"
              value={pdfOptions.height ?? ""}
              onChange={(e) => updateOption("height", e.target.value)}
              placeholder="e.g., 11in or 297mm"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">Paper height (e.g., 11in, 297mm)</p>
        </div>

        {/* Page Ranges */}
        <div className="bg-white p-3 rounded border">
          <label className="block text-sm font-medium mb-2">
            Page Ranges
            <input
              type="text"
              value={pdfOptions.pageRanges ?? ""}
              onChange={(e) => updateOption("pageRanges", e.target.value)}
              placeholder="e.g., 1-5, 8, 11-13"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Paper ranges to print (e.g., &apos;1-5, 8, 11-13&apos;)
          </p>
        </div>

        {/* Margins */}
        <div className="bg-white p-3 rounded border space-y-2">
          <h3 className="text-sm font-medium">Margins</h3>
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <label key={side} className="block text-sm">
              {side.charAt(0).toUpperCase() + side.slice(1)}
              <input
                type="text"
                value={pdfOptions.margin?.[side] ?? ""}
                onChange={(e) => {
                  const newMargin: {
                    top: string | number;
                    right: string | number;
                    bottom: string | number;
                    left: string | number;
                  } = {
                    top: "",
                    right: "",
                    bottom: "",
                    left: "",
                    ...pdfOptions.margin,
                    [side]: e.target.value,
                  };
                  updateOption("margin", newMargin);
                }}
                placeholder="e.g., 0.5in or 1cm"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </label>
          ))}
          <p className="text-xs text-gray-500 mt-1">Margin sizes (e.g., 0.5in, 1cm, 10mm)</p>
        </div>

        {/* Header Template */}
        <div className="bg-white p-3 rounded border">
          <label className="block text-sm font-medium mb-2">
            Header Template
            <textarea
              value={pdfOptions.headerTemplate ?? ""}
              onChange={(e) => updateOption("headerTemplate", e.target.value)}
              placeholder="HTML template for page header"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            HTML for header. Use classes: date, title, url, pageNumber, totalPages
          </p>
        </div>

        {/* Footer Template */}
        <div className="bg-white p-3 rounded border">
          <label className="block text-sm font-medium mb-2">
            Footer Template
            <textarea
              value={pdfOptions.footerTemplate ?? ""}
              onChange={(e) => updateOption("footerTemplate", e.target.value)}
              placeholder="HTML template for page footer"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            HTML for footer. Use classes: date, title, url, pageNumber, totalPages
          </p>
        </div>

        {/* JSON Input */}
        <div className="bg-white p-3 rounded border">
          <label className="block text-sm font-medium mb-2">
            Paste JSON Configuration
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"scale": 1, "format": "a4", "margin": {"top": "1in", "right": "1in", "bottom": "1in", "left": "1in"}}'
              rows={5}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs"
            />
          </label>
          <ActionButton variant="primary" size="sm" onClick={handleApplyJson} className="mt-2">
            Apply JSON
          </ActionButton>
        </div>

        {/* Current Configuration Display */}
        <div className="bg-gray-50 p-3 rounded border">
          <h3 className="text-sm font-medium mb-2">Current Configuration</h3>
          <pre className="text-xs overflow-auto max-h-64 bg-white p-2 rounded border">
            {JSON.stringify(pdfOptions, null, 2)}
          </pre>
        </div>
      </div>
    </>
  );
}
