import { IconButton } from "@/components/buttons";
import { useToast } from "@/components/toast/provider";
import { FileTag } from "@/components/workspace/FileTag";
import { useSession } from "next-auth/react";
import { LastLoadedFile } from "../utils";

type Props = Readonly<{
  md: string;
  openWorkspace: () => void;
  saveLocal: (md: string) => void;
  handleTranslateSelection: () => void;
  isApertiumPending: boolean;
  lastLoadedFile: LastLoadedFile | null;
}>;

export function EditorControls({
  md,
  openWorkspace,
  saveLocal,
  handleTranslateSelection,
  isApertiumPending,
  lastLoadedFile,
}: Props) {
  const { addToast } = useToast();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const { fileName, tags } = lastLoadedFile ?? { fileName: null, tags: null };

  return (
    <div className="w-2/5">
      <div className="flex items-center">
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
            onClick={openWorkspace}
            disabled={!isAuthenticated}
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

        {fileName && (
          <div className="ml-10 flex items-center overflow-hidden">
            <span className="mr-1">📄</span>
            <div className="flex flex-col overflow-hidden">
              <div className="text-xs text-gray-500">Last opened</div>
              <div className="flex">
                <div
                  className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis"
                  title={fileName}
                >
                  {fileName}
                </div>
                {tags && tags.size > 0 && (
                  <div className="flex mr-4">
                    {Array.from(tags).map((tag) => (
                      <FileTag key={tag} tag={tag} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
