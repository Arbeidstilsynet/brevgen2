"use client";

import { fetchFileContentFromAzure } from "@/actions/azdo";
import { useApertium } from "@/hooks/useApertium";
import { findMdVariables } from "@at/dynamic-markdown";
import { Editor, useMonaco } from "@monaco-editor/react";
import { DocumentTemplateOption } from "@repo/shared-types";
import { useCallback, useReducer, useState } from "react";
import { Overlay } from "../Overlay";
import { Profile } from "../Profile";
import { Config } from "../config";
import { Explanation, getIndicatedElementClass, IndictableElement } from "../explanation";
import { SpinnerOverlay } from "../spinner";
import { Toast } from "../toast/Toast";
import { ToastProvider, useToast } from "../toast/provider";
import { Workspace } from "../workspace";
import { WorkspaceContext } from "../workspace/provider";
import { Preview } from "./Preview";
import { TemplateConfig } from "./TemplateConfig";
import { VariablesTab } from "./VariablesTab";
import { advancedMd, advancedVars } from "./examples/advanced";
import { initialDefaultTemplateArgs, initialMd, initialVars } from "./examples/initial";
import { EditorHeader } from "./header";
import { EditorControls } from "./header/EditorControls";
import { ActivePreviewTab, PreviewControls } from "./header/PreviewControls";
import { TopLeft } from "./header/TopLeft";
import { defaultTemplateReducer } from "./templateConfigReducer";
import { useDynamicMarkdown } from "./useDynamicMarkdown";
import { useLoadPermanentUrl } from "./useLoadPermanentUrl";
import { getLoadedRepoFileName, getLoadedWorkspaceName, LastLoadedFile, saveLocal } from "./utils";

export function DynamicMarkdownEditor() {
  const monaco = useMonaco();
  const { md, setMd, parsedMd, parseError, mdVars, setMdVar, foundMdVars, mdVarsTypes, parse } =
    useDynamicMarkdown(initialMd, initialVars);

  const [activePreviewTab, setActivePreviewTab] = useState<ActivePreviewTab>("md");
  const [activeVarTab, setActiveVarTab] = useState<"variables" | "template">("variables");

  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateOption>("default");
  const [defaultTemplateState, defaultTemplateDispatch] = useReducer(
    defaultTemplateReducer,
    initialDefaultTemplateArgs,
  );

  const [currentModal, setCurrentModal] = useState<"explanation" | "config" | "workspace" | null>(
    null,
  );
  const [indicatedElement, setIndicatedElement] = useState<IndictableElement>(null);

  const [lastLoadedFile, setLastLoadedFile] = useState<LastLoadedFile | null>({
    fileName: "Examples/initial",
    tags: null,
  });

  const { message, variant, clearToast } = useToast();

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
    setCurrentModal(null);
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
    setCurrentModal(null);
    const fileName = filePath.split("/").at(-1)!;
    setLastLoadedFile({ fileName: getLoadedRepoFileName({ systemName, fileName }), tags: null });
  };

  const handleLoadFromWorkspace = useCallback(
    (md: string, fileName: string, tags: Set<string>) => {
      loadMdWithEmptyVars(md);
      setCurrentModal(null);
      setLastLoadedFile({ fileName: getLoadedWorkspaceName(fileName), tags });
    },
    [loadMdWithEmptyVars],
  );

  const isLoadingPermanentUrl = useLoadPermanentUrl(
    Boolean(monaco),
    loadMdWithEmptyVars,
    setLastLoadedFile,
  );

  const { handleTranslateSelection, isApertiumPending } = useApertium(monaco, (fullEditorText) =>
    setMd(fullEditorText),
  );

  const renderOverlays = () => (
    <>
      {isLoadingPermanentUrl && <SpinnerOverlay />}
      {currentModal === "explanation" && (
        <Overlay
          onClose={() => {
            setCurrentModal(null);
            setIndicatedElement(null);
          }}
        >
          <Explanation setHoveredElement={setIndicatedElement} />
        </Overlay>
      )}
      {currentModal === "config" && (
        <Overlay widthPercent={60} onClose={() => setCurrentModal(null)}>
          <ToastProvider>
            <Config onFileSelected={handleFileSelected} onExampleSelected={handleExampleSelected} />
          </ToastProvider>
        </Overlay>
      )}
      {currentModal === "workspace" && (
        <Overlay widthPercent={55} heightPercent={90} onClose={() => setCurrentModal(null)}>
          <ToastProvider>
            <WorkspaceContext value={{ currentMd: md, onLoadMd: handleLoadFromWorkspace }}>
              <Workspace />
            </WorkspaceContext>
          </ToastProvider>
        </Overlay>
      )}
    </>
  );

  return (
    <div className="flex flex-col h-screen">
      {message && <Toast message={message} variant={variant} onClose={clearToast} />}
      {renderOverlays()}

      <EditorHeader>
        <TopLeft
          setCurrentModal={setCurrentModal}
          activeVarTab={activeVarTab}
          setActiveVarTab={setActiveVarTab}
        />
        <EditorControls
          md={md}
          openWorkspace={() => setCurrentModal("workspace")}
          saveLocal={saveLocal}
          handleTranslateSelection={handleTranslateSelection}
          isApertiumPending={isApertiumPending}
          lastLoadedFile={lastLoadedFile}
        />
        <div className="w-2/5 flex justify-between">
          <PreviewControls
            activePreviewTab={activePreviewTab}
            setActivePreviewTab={setActivePreviewTab}
            indicatedElement={indicatedElement}
          />
          <Profile />
        </div>
      </EditorHeader>

      <main className="flex flex-1 overflow-hidden">
        <div
          className={`w-1/5 p-4 overflow-y-auto bg-gray-100 ${getIndicatedElementClass("vars", indicatedElement)}`}
        >
          {activeVarTab === "variables" && (
            <VariablesTab
              foundMdVars={foundMdVars}
              mdVarsTypes={mdVarsTypes}
              mdVars={mdVars}
              setMdVar={setMdVar}
              setCurrentModal={setCurrentModal}
            />
          )}
          {activeVarTab === "template" && (
            <TemplateConfig
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              defaultTemplateState={defaultTemplateState}
              defaultTemplateDispatch={defaultTemplateDispatch}
            />
          )}
        </div>

        <div
          className={`w-2/5 p-4 relative ${getIndicatedElementClass("editor", indicatedElement)}`}
        >
          {parseError && (
            <div className="absolute top-2 right-8 max-w-[calc(40%-20px)] bg-red-800 text-white p-2 rounded-sm z-50 break-words">
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
