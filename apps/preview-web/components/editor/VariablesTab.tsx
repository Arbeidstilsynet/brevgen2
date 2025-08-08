"use client";
import { ActionButton } from "../buttons";
import { useToast } from "../toast/provider";
import { fillVarsFromClipboard, getRandomValue } from "./utils";
import { VariableInput } from "./VariableInput";

interface VariablesTabProps {
  foundMdVars: Set<string>;
  mdVarsTypes: Record<string, "string" | "boolean">;
  mdVars: Record<string, string | boolean>;
  setMdVar: (mdVar: string, value: string | boolean) => void;
  setCurrentModal: (modal: "explanation" | "config" | "workspace" | null) => void;
}

export function VariablesTab({
  foundMdVars,
  mdVarsTypes,
  mdVars,
  setMdVar,
  setCurrentModal,
}: Readonly<VariablesTabProps>) {
  const { addToast } = useToast();

  const handleFillRandomValues = () => {
    for (const varName of foundMdVars) {
      setMdVar(varName, getRandomValue(varName));
    }
  };

  const handlePasteJsonFromClipboard = async () => {
    await fillVarsFromClipboard(foundMdVars, setMdVar, addToast);
  };

  const handleCopyVarsToClipboard = async () => {
    await navigator.clipboard.writeText(JSON.stringify(mdVars));
    addToast("info", "Copied variables to clipboard");
  };

  if (foundMdVars.size === 0) {
    return (
      <div className="p-3 border border-dashed rounded bg-white text-gray-700">
        <p className="mb-2">No variables found in the markdown.</p>
        <ul className="list-disc pl-5 mb-3">
          <li>
            Add <code>{"{{variable}}"}</code> tokens in the editor
          </li>
          <li>Or load an example or file</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <ActionButton variant="neutral" size="sm" onClick={() => setCurrentModal("config")}>
            Open examples / repo
          </ActionButton>
          <ActionButton variant="neutral" size="sm" onClick={() => setCurrentModal("workspace")}>
            Open workspace
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-gray-100 pb-2 mb-2">
        <div className="flex flex-wrap gap-2">
          <ActionButton
            variant="neutral"
            size="sm"
            onClick={handleFillRandomValues}
            className="whitespace-nowrap"
          >
            Fill with random values
          </ActionButton>
          <ActionButton
            variant="neutral"
            size="sm"
            onClick={handlePasteJsonFromClipboard}
            className="whitespace-nowrap"
          >
            Fill with clipboard JSON
          </ActionButton>
          <ActionButton
            variant="neutral"
            size="sm"
            onClick={handleCopyVarsToClipboard}
            className="whitespace-nowrap"
          >
            Copy variables to clipboard
          </ActionButton>
        </div>
      </div>

      {[...foundMdVars].map((variable) => (
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
  );
}
