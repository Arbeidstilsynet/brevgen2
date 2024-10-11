"use client";

import { fetchFileContentFromAzure } from "@/actions/azdo";
import { findMdVariables, parseDynamicMd } from "@at/dynamic-markdown";
import { Editor, useMonaco } from "@monaco-editor/react";
import { useEffect, useReducer, useState } from "react";
import { Overlay } from "../Overlay";
import { Config } from "../config";
import { Preview } from "./Preview";
import { TemplateConfig } from "./TemplateConfig";
import { TemplateOption } from "./TemplatePicker";
import { VariableInput } from "./VariableInput";
import { initialDefaultTemplateArgs, initialMd, initialVars } from "./initialState";
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

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

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

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setMd(value);
    }
  };

  const handleVarInputChange = (variable: string, value: string | boolean) => {
    setMdVars((prevVars) => ({
      ...prevVars,
      [variable]: value,
    }));
  };

  const handleVarTypeToggle = (variable: string) => {
    setMdVarTypes((prevTypes) => ({
      ...prevTypes,
      [variable]: prevTypes[variable] === "string" ? "boolean" : "string",
    }));
  };

  const handleFileSelected = async (repoId: string, branch: string, file: string) => {
    const data = await fetchFileContentFromAzure(repoId, branch, file);
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
    setIsOverlayOpen(false);
  };

  return (
    <div className="flex flex-col h-screen">
      {isOverlayOpen && (
        <Overlay onClose={() => setIsOverlayOpen(false)}>
          <Config onFileSelected={handleFileSelected} />
        </Overlay>
      )}
      <div className="h-[5vh] flex items-center bg-gray-200">
        <button
          className="p-2 mr-4 hover:bg-gray-300 transition duration-200"
          onClick={() => setIsOverlayOpen(true)}
          aria-label="Open config"
        >
          ⚙️
        </button>
        <div className="w-1/5">
          <button
            className={`mr-2 p-2 ${activeVarTab === "variables" ? "bg-blue-500 text-white" : "bg-gray-300"}`}
            onClick={() => setActiveVarTab("variables")}
          >
            Variables
          </button>
          <button
            className={`p-2 ${activeVarTab === "template" ? "bg-blue-500 text-white" : "bg-gray-300"}`}
            onClick={() => setActiveVarTab("template")}
          >
            Template
          </button>
        </div>
        <div className="w-2/5"></div>
        <div className="w-2/5 flex">
          <button
            className={`mr-2 p-2 ${activePreviewTab === "markdown" ? "bg-blue-500 text-white" : "bg-gray-300"}`}
            onClick={() => setActivePreviewTab("markdown")}
          >
            Markdown
          </button>
          <button
            className={`mr-2 p-2 ${activePreviewTab === "html" ? "bg-blue-500 text-white" : "bg-gray-300"}`}
            onClick={() => setActivePreviewTab("html")}
          >
            HTML
          </button>
          <button
            className={`p-2 ${activePreviewTab === "pdf" ? "bg-blue-500 text-white" : "bg-gray-300"}`}
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
                handleVarInputChange={handleVarInputChange}
                handleVarTypeToggle={handleVarTypeToggle}
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
            onChange={handleEditorChange}
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
    </div>
  );
}
