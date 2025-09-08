"use client";

import { TabButton } from "@/components/buttons";
import { useSettings } from "@/components/config/settingsProvider";
import { getIndicatedElementClass, IndictableElement } from "@/components/explanation";
import { useSession } from "next-auth/react";

export type ActivePreviewTab = "md" | "html" | "html-remote" | "pdf";

type Props = Readonly<{
  activePreviewTab: ActivePreviewTab;
  setActivePreviewTab: (tab: ActivePreviewTab) => void;
  indicatedElement: IndictableElement;
}>;

export function PreviewControls({
  activePreviewTab,
  setActivePreviewTab,
  indicatedElement,
}: Props) {
  const { settings } = useSettings();
  const { status } = useSession();

  return (
    <>
      <span
        className={`flex max-w-min ${getIndicatedElementClass("previewTabs", indicatedElement)}`}
      >
        <TabButton isActive={activePreviewTab === "md"} onClick={() => setActivePreviewTab("md")}>
          Markdown
        </TabButton>
        <TabButton
          isActive={activePreviewTab === "html"}
          onClick={() => setActivePreviewTab("html")}
        >
          HTML
        </TabButton>
        <TabButton
          disabled={status !== "authenticated"}
          isActive={activePreviewTab === "pdf"}
          onClick={() => setActivePreviewTab("pdf")}
        >
          PDF
        </TabButton>

        {settings.advancedFeatures.htmlRemoteTab && (
          <TabButton
            disabled={status !== "authenticated"}
            isActive={activePreviewTab === "html-remote"}
            onClick={() => setActivePreviewTab("html-remote")}
          >
            HTML (remote)
          </TabButton>
        )}
      </span>
    </>
  );
}
