"use client";

import { IconButton, TabButton } from "@/components/buttons";
import { useSettings } from "@/components/config/settingsProvider";

export type TabName = "variables" | "template" | "pdfOptions";

type Props = Readonly<{
  setCurrentModal: (modal: "explanation" | "config" | "workspace" | null) => void;
  activeVarTab: TabName;
  setActiveVarTab: (tab: TabName) => void;
}>;

export function TopLeft({ setCurrentModal, activeVarTab, setActiveVarTab }: Props) {
  const { settings } = useSettings();

  return (
    <div className="flex items-center justify-between w-1/5">
      <div className="flex gap-2 ml-2">
        <IconButton
          variant="blue"
          aria-label="Open explanation"
          title="Open explanation"
          onClick={() => setCurrentModal("explanation")}
        >
          ℹ️
        </IconButton>
        <IconButton
          variant="blue"
          aria-label="Open config"
          title="Open config"
          onClick={() => setCurrentModal("config")}
        >
          ⚙️
        </IconButton>
      </div>

      <div className="flex flex-1 justify-center">
        <TabButton
          isActive={activeVarTab === "variables"}
          onClick={() => setActiveVarTab("variables")}
        >
          Variables
        </TabButton>
        <TabButton
          isActive={activeVarTab === "template"}
          onClick={() => setActiveVarTab("template")}
        >
          Template
        </TabButton>

        {settings.advancedFeatures.customizePdfOptions && (
          <TabButton
            isActive={activeVarTab === "pdfOptions"}
            onClick={() => setActiveVarTab("pdfOptions")}
          >
            PDFOptions
          </TabButton>
        )}
      </div>
    </div>
  );
}
