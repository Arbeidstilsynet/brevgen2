import { IconButton, TabButton } from "@/components/buttons";

type Props = Readonly<{
  setIsExplanationOpen: (open: boolean) => void;
  setIsConfigOpen: (open: boolean) => void;
  activeVarTab: "variables" | "template";
  setActiveVarTab: (tab: "variables" | "template") => void;
}>;

export function TopLeft({
  setIsExplanationOpen,
  setIsConfigOpen,
  activeVarTab,
  setActiveVarTab,
}: Props) {
  return (
    <div className="flex items-center justify-between w-1/5">
      <div className="flex gap-2 ml-2">
        <IconButton
          variant="blue"
          aria-label="Open explanation"
          title="Open explanation"
          onClick={() => setIsExplanationOpen(true)}
        >
          ℹ️
        </IconButton>
        <IconButton
          variant="blue"
          aria-label="Open config"
          title="Open config"
          onClick={() => setIsConfigOpen(true)}
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
      </div>
    </div>
  );
}
