import { TabButton } from "@/components/buttons";
import { getIndicatedElementClass, IndictableElement } from "@/components/explanation";

export type ActivePreviewTab = "md" | "html" | "pdf";

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
  return (
    <div className={`w-2/5 flex ${getIndicatedElementClass("previewTabs", indicatedElement)}`}>
      <TabButton isActive={activePreviewTab === "md"} onClick={() => setActivePreviewTab("md")}>
        Markdown
      </TabButton>
      <TabButton isActive={activePreviewTab === "html"} onClick={() => setActivePreviewTab("html")}>
        HTML
      </TabButton>
      <TabButton isActive={activePreviewTab === "pdf"} onClick={() => setActivePreviewTab("pdf")}>
        PDF
      </TabButton>
    </div>
  );
}
