"use client";

import { fetchFileContentFromAzure } from "@/actions/azdo";
import { useApertium } from "@/hooks/useApertium";
import { TemplateOption } from "@at/document-templates";
import { findMdVariables } from "@at/dynamic-markdown";
import { Editor, useMonaco } from "@monaco-editor/react";
import { useCallback, useReducer, useState } from "react";
import { Overlay } from "../Overlay";
import { ActionButton } from "../buttons";
import { Config } from "../config";
import { Explanation, getIndicatedElementClass, IndictableElement } from "../explanation";
import { Spinner, SpinnerOverlay } from "../spinner";
import { Toast } from "../toast/Toast";
import { ToastProvider, useToast } from "../toast/provider";
import { Workspace } from "../workspace";
import { WorkspaceContext } from "../workspace/provider";
import { Preview } from "./Preview";
import { TemplateConfig } from "./TemplateConfig";
import { VariableInput } from "./VariableInput";
import { advancedMd, advancedVars } from "./examples/advanced";
import { initialDefaultTemplateArgs, initialMd, initialVars } from "./examples/initial";
import { EditorHeader } from "./header";
import { EditorControls } from "./header/EditorControls";
import { ActivePreviewTab, PreviewControls } from "./header/PreviewControls";
import { TopLeft } from "./header/TopLeft";
import { defaultTemplateReducer } from "./templateConfigReducer";
import { useDynamicMarkdown } from "./useDynamicMarkdown";
import { useLoadPermanentUrl } from "./useLoadPermanentUrl";
import {
  getLoadedRepoFileName,
  getLoadedWorkspaceName,
  getRandomValue,
  LastLoadedFile,
  saveLocal,
} from "./utils";

export function DynamicMarkdownEditor() {
  const monaco = useMonaco();
  const { md, setMd, parsedMd, parseError, mdVars, setMdVar, foundMdVars, mdVarsTypes, parse } =
    useDynamicMarkdown(initialMd, initialVars);

  const [activePreviewTab, setActivePreviewTab] = useState<ActivePreviewTab>("md");
  const [activeVarTab, setActiveVarTab] = useState<"variables" | "template">("variables");

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>("default");
  const [defaultTemplateState, defaultTemplateDispatch] = useReducer(
    defaultTemplateReducer,
    initialDefaultTemplateArgs,
  );

  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [indicatedElement, setIndicatedElement] = useState<IndictableElement>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const [lastLoadedFile, setLastLoadedFile] = useState<LastLoadedFile | null>({
    fileName: "Examples/initial",
    tags: null,
  });

  const updateEditor = useCallback(
    (md: string, vars: typeof mdVars) => {
      if (!monaco) {
        throw new TypeError("Expected Monaco to be instantiated");
      }
      const editor = monaco.editor.getEditors()[0];
      if (editor) {
        editor.setValue(md);
        editor.focus();
      }
      parse(md, vars);
    },
    [monaco, parse],
  );

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
    updateEditor(data, vars);
    setIsConfigOpen(false);
    setLastLoadedFile({ fileName: `Examples/${example}`, tags: null });
  };

  const loadMdWithEmptyVars = useCallback(
    (md: string) => {
      const foundVariables = findMdVariables(md);
      const vars: Record<string, string> = {};
      // set empty string defaults for all variables to avoid parsing error on load
      foundVariables.forEach((v) => (vars[v] = ""));
      updateEditor(md, vars);
    },
    [updateEditor],
  );

  const handleFileSelected = async (
    repoId: string,
    branch: string,
    filePath: string,
    systemName: string,
  ) => {
    const md = await fetchFileContentFromAzure(repoId, branch, filePath);
    loadMdWithEmptyVars(md);
    setIsConfigOpen(false);
    const fileName = filePath.split("/").at(-1)!;
    setLastLoadedFile({ fileName: getLoadedRepoFileName({ systemName, fileName }), tags: null });
  };

  const handleLoadFromWorkspace = useCallback(
    (md: string, fileName: string, tags: Set<string>) => {
      loadMdWithEmptyVars(md);
      setIsWorkspaceOpen(false);
      setLastLoadedFile({ fileName: getLoadedWorkspaceName(fileName), tags });
    },
    [loadMdWithEmptyVars],
  );

  const isLoadingPermanentUrl = useLoadPermanentUrl(
    Boolean(monaco),
    loadMdWithEmptyVars,
    setLastLoadedFile,
  );

  const handleFillRandomValues = () => {
    for (const varName of foundMdVars) {
      setMdVar(varName, getRandomValue(varName));
    }
  };

  const { handleTranslateSelection, isApertiumPending } = useApertium(monaco, (fullEditorText) =>
    setMd(fullEditorText),
  );

  const { message, variant, clearToast } = useToast();

  return (
    <div className="flex flex-col h-screen">
      {isLoadingPermanentUrl && (
        <SpinnerOverlay>
          <Spinner />
        </SpinnerOverlay>
      )}

      {message && <Toast message={message} variant={variant} onClose={clearToast} />}

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
        <Overlay widthPercent={60} onClose={() => setIsConfigOpen(false)}>
          <ToastProvider>
            <Config onFileSelected={handleFileSelected} onExampleSelected={handleExampleSelected} />
          </ToastProvider>
        </Overlay>
      )}
      {isWorkspaceOpen && (
        <Overlay widthPercent={55} heightPercent={90} onClose={() => setIsWorkspaceOpen(false)}>
          <ToastProvider>
            <WorkspaceContext value={{ currentMd: md, onLoadMd: handleLoadFromWorkspace }}>
              <Workspace />
            </WorkspaceContext>
          </ToastProvider>
        </Overlay>
      )}

      <EditorHeader>
        <TopLeft
          activeVarTab={activeVarTab}
          setIsExplanationOpen={setIsExplanationOpen}
          setIsConfigOpen={setIsConfigOpen}
          setActiveVarTab={setActiveVarTab}
        />
        <EditorControls
          md={md}
          setIsWorkspaceOpen={setIsWorkspaceOpen}
          saveLocal={saveLocal}
          handleTranslateSelection={handleTranslateSelection}
          isApertiumPending={isApertiumPending}
          lastLoadedFile={lastLoadedFile}
        />
        <PreviewControls
          activePreviewTab={activePreviewTab}
          setActivePreviewTab={setActivePreviewTab}
          indicatedElement={indicatedElement}
        />
      </EditorHeader>

      <main className="flex flex-1 overflow-hidden">
        <div
          className={`w-1/5 p-4 overflow-y-auto bg-gray-100  ${getIndicatedElementClass("vars", indicatedElement)}`}
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
                <ActionButton variant="secondary" onClick={handleFillRandomValues} className="mb-4">
                  Fill random values
                </ActionButton>
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
            defaultLanguage="markdown"
            defaultValue={initialMd}
            onChange={(value) => {
              if (typeof value === "string") {
                setMd(value);
              }
            }}
            onMount={(editor) => {
              editor.focus();
            }}
            options={{
              wordWrap: "on",
            }}
          />
        </div>

        <div
          className={`w-2/5 p-4 bg-gray-50 ${getIndicatedElementClass("preview", indicatedElement)}`}
        >
          <Preview
            activePreviewTab={activePreviewTab}
            md={md}
            parsedMd={parsedMd}
            mdVariables={mdVars}
            selectedTemplate={selectedTemplate}
            defaultTemplateArgs={defaultTemplateState}
          />
        </div>
      </main>
    </div>
  );
}
