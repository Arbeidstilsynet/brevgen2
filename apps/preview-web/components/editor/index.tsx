"use client";

import { fetchFileContentFromAzure } from "@/actions/azdo";
import { findMdVariables } from "@at/dynamic-markdown";
import { Editor, useMonaco } from "@monaco-editor/react";
import { useReducer, useState } from "react";
import { Overlay } from "../Overlay";
import { Config } from "../config";
import { Explanation, IndictableElement } from "../explanation";
import { Preview } from "./Preview";
import { TemplateConfig } from "./TemplateConfig";
import { TemplateOption } from "./TemplatePicker";
import { VariableInput } from "./VariableInput";
import { advancedMd, advancedVars } from "./examples/advanced";
import { initialDefaultTemplateArgs, initialMd, initialVars } from "./examples/initial";
import { defaultTemplateReducer } from "./templateConfigReducer";
import { useDynamicMarkdown } from "./useDynamicMarkdown";
import { getRandomValue } from "./utils";

const getIndicatedElementClass = (
  element: IndictableElement,
  indicatedElement: IndictableElement,
) =>
  `outline-dashed outline-4 ${indicatedElement === element ? "outline-blue-500" : "outline-transparent"}`;

const saveLocal = async (md: string) => {
  // use native save window in chromium
  if (window.showSaveFilePicker) {
    try {
      const newHandle = await window.showSaveFilePicker({
        types: [
          {
            description: "Markdown Files",
            accept: { "text/markdown": [".md"] },
          },
        ],
      });
      const writableStream = await newHandle.createWritable();
      await writableStream.write(md);
      await writableStream.close();
    } catch (err) {
      const isError = err instanceof Error;
      // silently skip AbortError that occurs if user closes the save window
      if (!isError || (isError && err.name !== "AbortError")) {
        throw err;
      }
    }
  }
  // handle firefox etc.
  else {
    const blob = new Blob([md], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "document.md";
    link.click();
    URL.revokeObjectURL(link.href);
  }
};

export function DynamicMarkdownEditor() {
  const monaco = useMonaco();
  const { md, setMd, parsedMd, parseError, mdVars, setMdVar, foundMdVars, mdVarsTypes, parse } =
    useDynamicMarkdown(initialMd, initialVars);

  const [activePreviewTab, setActivePreviewTab] = useState<"markdown" | "html" | "pdf">("markdown");
  const [activeVarTab, setActiveVarTab] = useState<"variables" | "template">("variables");

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>("default");
  const [defaultTemplateState, defaultTemplateDispatch] = useReducer(
    defaultTemplateReducer,
    initialDefaultTemplateArgs,
  );

  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [indicatedElement, setIndicatedElement] = useState<IndictableElement>(null);

  function updateEditor(value: string) {
    if (monaco) {
      const editor = monaco.editor.getEditors()[0];
      if (editor) {
        editor.setValue(value);
      }
    } else {
      throw new TypeError("Expected Monaco to be instansiated");
    }
  }

  const handleFileSelected = async (repoId: string, branch: string, file: string) => {
    const data = await fetchFileContentFromAzure(repoId, branch, file);
    // set empty string defaults for all variables to avoid parsing error
    const foundVariables = findMdVariables(data);
    const vars: Record<string, string> = {};
    foundVariables.forEach((v) => (vars[v] = ""));

    updateEditor(data);
    parse(data, vars);
    setIsConfigOpen(false);
  };

  const handleExampleSelected = (example: "initial" | "advanced") => {
    let data: string;
    let vars: typeof mdVars;
    switch (example) {
      case "initial":
        data = initialMd;
        vars = initialVars;
        break;
      case "advanced":
        data = advancedMd;
        vars = advancedVars;
        break;
    }
    updateEditor(data);
    parse(data, vars);
  };

  const handleFillRandomValues = () => {
    for (const varName of foundMdVars) {
      setMdVar(varName, getRandomValue(varName));
    }
  };

  return (
    <main className="flex flex-col h-screen">
      {isExplanationOpen && (
        <Overlay
          onClose={() => {
            setIsExplanationOpen(false);
            setIndicatedElement(null);
          }}
        >
          <Explanation setHoveredElement={setIndicatedElement} />
        </Overlay>
      )}
      {isConfigOpen && (
        <Overlay onClose={() => setIsConfigOpen(false)}>
          <Config onFileSelected={handleFileSelected} onExampleSelected={handleExampleSelected} />
        </Overlay>
      )}

      <div className="h-[5vh] flex items-center bg-gray-200">
        <div className="flex w-1/5">
          <button
            className="ml-1 mr-2 flex items-center justify-center w-10 h-10 bg-blue-100 text-gray-900 rounded-lg hover:bg-blue-300 hover:shadow-lg transition duration-200"
            onClick={() => setIsExplanationOpen(true)}
            aria-label="Open explanation"
          >
            <span className="text-2xl font-bold">ℹ️</span>
          </button>
          <button
            className="p-2 mr-4 flex items-center justify-center w-10 h-10 bg-blue-100 text-gray-900 rounded-lg hover:bg-blue-300 hover:shadow-lg transition duration-200"
            onClick={() => setIsConfigOpen(true)}
            aria-label="Open config"
          >
            <span className="text-2xl font-bold">⚙️</span>
          </button>

          <button
            className={`mr-2 p-2 transition duration-200
      ${activeVarTab === "variables" ? "bg-blue-500 text-white shadow-lg" : "bg-gray-300 text-gray-800 hover:bg-gray-400"}`}
            onClick={() => setActiveVarTab("variables")}
          >
            Variables
          </button>
          <button
            className={`p-2 transition duration-200
      ${activeVarTab === "template" ? "bg-blue-500 text-white shadow-lg" : "bg-gray-300 text-gray-800 hover:bg-gray-400"}`}
            onClick={() => setActiveVarTab("template")}
          >
            Template
          </button>
        </div>

        <div className="w-2/5">
          <div className="flex space-x-2">
            <button
              className="p-1 flex items-center justify-center h-8 w-8 bg-green-100 text-gray-900 rounded-lg hover:bg-green-300 hover:shadow-lg transition duration-200"
              onClick={() => {
                navigator.clipboard.writeText(md);
              }}
              aria-label="Copy"
              title="Copy"
            >
              <span className="text-2xl font-bold">📋</span>
            </button>
            <button
              className="p-1 flex items-center justify-center h-8 w-8 bg-green-100 text-gray-900 rounded-lg hover:bg-green-300 hover:shadow-lg transition duration-200"
              onClick={() => saveLocal(md)}
              aria-label="Save"
              title="Save"
            >
              <span className="text-2xl font-bold">💾</span>
            </button>
          </div>
        </div>

        <div className={`w-2/5 flex ${getIndicatedElementClass("previewTabs", indicatedElement)}`}>
          <button
            className={`mr-2 p-2 transition duration-200
      ${activePreviewTab === "markdown" ? "bg-blue-500 text-white shadow-lg" : "bg-gray-300 text-gray-800 hover:bg-gray-400"}`}
            onClick={() => setActivePreviewTab("markdown")}
          >
            Markdown
          </button>
          <button
            className={`mr-2 p-2 transition duration-200
      ${activePreviewTab === "html" ? "bg-blue-500 text-white shadow-lg" : "bg-gray-300 text-gray-800 hover:bg-gray-400"}`}
            onClick={() => setActivePreviewTab("html")}
          >
            HTML
          </button>
          <button
            className={`p-2 transition duration-200
      ${activePreviewTab === "pdf" ? "bg-blue-500 text-white shadow-lg" : "bg-gray-300 text-gray-800 hover:bg-gray-400"}`}
            onClick={() => setActivePreviewTab("pdf")}
          >
            PDF
          </button>
        </div>
      </div>

      <div className="flex flex-grow">
        <div
          className={`w-1/5 p-4 bg-gray-100 ${getIndicatedElementClass("vars", indicatedElement)}`}
        >
          {activeVarTab === "template" && (
            <TemplateConfig
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              defaultTemplateState={defaultTemplateState}
              defaultTemplateDispatch={defaultTemplateDispatch}
            />
          )}

          {activeVarTab === "variables" && (
            <>
              {Array.from(foundMdVars).length > 0 && (
                <button
                  onClick={handleFillRandomValues}
                  className="mb-4 p-2 bg-blue-500 text-white rounded"
                >
                  Fill random values
                </button>
              )}

              {Array.from(foundMdVars).map((variable) => (
                <VariableInput
                  key={variable}
                  variable={variable}
                  varType={mdVarsTypes[variable]}
                  value={mdVars[variable]}
                  handleVarInputChange={(variable, value) => {
                    setMdVar(variable, value);
                  }}
                />
              ))}
            </>
          )}
        </div>

        <div
          className={`w-2/5 p-4 relative ${getIndicatedElementClass("editor", indicatedElement)}`}
        >
          {parseError && (
            <div className="absolute top-2 right-8 max-w-[calc(40%-20px)] bg-red-800 text-white p-2 rounded z-50 break-words">
              {parseError.message}
            </div>
          )}
          <Editor
            height="calc(94vh - 1rem)"
            defaultLanguage="markdown"
            defaultValue={initialMd}
            onChange={(value) => {
              if (typeof value === "string") {
                setMd(value);
              }
            }}
            options={{
              wordWrap: "on",
            }}
          />
        </div>

        <div
          className={`w-2/5 p-4 bg-gray-50 ${getIndicatedElementClass("preview", indicatedElement)}`}
        >
          <div className="output-container h-full">
            <Preview
              activePreviewTab={activePreviewTab}
              md={md}
              parsedMd={parsedMd}
              mdVariables={mdVars}
              selectedTemplate={selectedTemplate}
              defaultTemplateArgs={defaultTemplateState}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
