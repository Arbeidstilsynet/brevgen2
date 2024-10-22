"use client";

import { fetchFileContentFromAzure } from "@/actions/azdo";
import { findMdVariables, parseDynamicMd } from "@at/dynamic-markdown";
import { Editor, useMonaco } from "@monaco-editor/react";
import { useEffect, useReducer, useState } from "react";
import { Overlay } from "../Overlay";
import { Config } from "../config";
import { Explanation } from "../explanation";
import { Preview } from "./Preview";
import { TemplateConfig } from "./TemplateConfig";
import { TemplateOption } from "./TemplatePicker";
import { VariableInput } from "./VariableInput";
import { advancedMd, advancedVars } from "./examples/advanced";
import { initialDefaultTemplateArgs, initialMd, initialVars } from "./examples/initial";
import { defaultTemplateReducer } from "./templateConfigReducer";
import { generateMdVarTypes } from "./utils";

export function DynamicMarkdownEditor() {
  const monaco = useMonaco();

  const [md, setMd] = useState(initialMd);
  const [parsedMd, setParsedMd] = useState(() =>
    parseDynamicMd(initialMd, { variables: initialVars }),
  );
  const [parseError, setParseError] = useState<Error | null>(null);

  const [mdVars, setMdVars] = useState<Record<string, string | boolean>>(initialVars);
  const [mdVarsValue, setMdVarsValue] = useState<Set<string>>(() => findMdVariables(initialMd));
  const [mdVarTypes, setMdVarTypes] = useState<{
    [key: string]: "string" | "boolean";
  }>(() => generateMdVarTypes(initialVars));

  const [activePreviewTab, setActivePreviewTab] = useState<"markdown" | "html" | "pdf">("markdown");
  const [activeVarTab, setActiveVarTab] = useState<"variables" | "template">("variables");

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>("default");
  const [defaultTemplateState, defaultTemplateDispatch] = useReducer(
    defaultTemplateReducer,
    initialDefaultTemplateArgs,
  );

  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    const tryParse = (value: string) => {
      try {
        const foundVariables = findMdVariables(value);
        setMdVarsValue(foundVariables);
        setMdVarTypes((prevTypes) => {
          const newTypes = { ...prevTypes };
          foundVariables.forEach((variable) => {
            if (!newTypes[variable]) {
              newTypes[variable] = "string";
            }
          });
          return newTypes;
        });

        const parsedOutput = parseDynamicMd(value, { variables: mdVars });
        setParsedMd(parsedOutput);
        setParseError(null);
      } catch (error) {
        if (error instanceof Error) {
          setParseError(error);
        } else {
          throw error;
        }
      }
    };

    tryParse(md);
  }, [md, mdVars]);

  function loadDynamicMarkdown(data: string) {
    if (monaco) {
      const editor = monaco.editor.getEditors()[0];
      if (editor) {
        editor.setValue(data);
        // set empty string defaults for all variables to avoid parsing error
        const foundVariables = findMdVariables(data);
        const newVars: Record<string, string> = {};
        foundVariables.forEach((v) => (newVars[v] = ""));
        setMdVars(newVars);
      }
    } else {
      throw new TypeError("Expected Monaco to be instansiated");
    }
  }

  const handleFileSelected = async (repoId: string, branch: string, file: string) => {
    const data = await fetchFileContentFromAzure(repoId, branch, file);
    loadDynamicMarkdown(data);
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
    loadDynamicMarkdown(data);
    setMdVars(vars);
  };

  const handleSaveLocal = async () => {
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

  return (
    <main className="flex flex-col h-screen">
      {isExplanationOpen && (
        <Overlay onClose={() => setIsExplanationOpen(false)}>
          <Explanation />
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
              onClick={handleSaveLocal}
              aria-label="Save"
              title="Save"
            >
              <span className="text-2xl font-bold">💾</span>
            </button>
          </div>
        </div>

        <div className="w-2/5 flex">
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
        <div className="w-1/5 p-4 bg-gray-100">
          {activeVarTab === "template" && (
            <TemplateConfig
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              defaultTemplateState={defaultTemplateState}
              defaultTemplateDispatch={defaultTemplateDispatch}
            />
          )}

          {activeVarTab === "variables" &&
            Array.from(mdVarsValue).map((variable) => (
              <VariableInput
                key={variable}
                variable={variable}
                varTypes={mdVarTypes}
                mdVars={mdVars}
                handleVarInputChange={(variable, value) => {
                  setMdVars((prevVars) => ({
                    ...prevVars,
                    [variable]: value,
                  }));
                }}
              />
            ))}
        </div>

        <div className="w-2/5 p-4 relative">
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
              if (value) {
                setMd(value);
              }
            }}
            options={{
              wordWrap: "on",
            }}
          />
        </div>

        <div className="w-2/5 p-4 bg-gray-50">
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
