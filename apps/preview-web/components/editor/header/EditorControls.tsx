import { IconButton } from "@/components/buttons";
import { useToast } from "@/components/toast/provider";

type Props = Readonly<{
  md: string;
  setIsWorkspaceOpen: (open: boolean) => void;
  saveLocal: (md: string) => void;
  handleTranslateSelection: () => void;
  isApertiumPending: boolean;
}>;

export function EditorControls({
  md,
  setIsWorkspaceOpen,
  saveLocal,
  handleTranslateSelection,
  isApertiumPending,
}: Props) {
  const { addToast } = useToast();
  return (
    <div className="w-2/5">
      <div className="flex">
        <div className="flex gap-2">
          <IconButton
            variant="green"
            aria-label="Copy"
            title="Copy"
            onClick={async () => {
              await navigator.clipboard.writeText(md);
              addToast("info", "Copied to clipboard!");
            }}
          >
            📋
          </IconButton>
          <IconButton variant="green" onClick={() => saveLocal(md)} aria-label="Save" title="Save">
            💾
          </IconButton>
          <IconButton
            variant="green"
            aria-label="Manage workspace"
            title="Manage workspace"
            onClick={() => setIsWorkspaceOpen(true)}
          >
            📂
          </IconButton>
        </div>

        <div className="flex gap-2 ml-6">
          <IconButton
            variant="indigo"
            aria-label="Translate selected text"
            title="Translate selected text (nob→nno_e)"
            disabled={isApertiumPending}
            className={isApertiumPending ? "opacity-50 cursor-not-allowed" : undefined}
            textClassName={isApertiumPending ? "animate-spin" : undefined}
            onClick={handleTranslateSelection}
          >
            {isApertiumPending ? "⟳" : "🌍"}
          </IconButton>
        </div>
      </div>
    </div>
  );
}
