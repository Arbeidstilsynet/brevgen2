import { use, useId, useState } from "react";
import { useToast } from "../toast/provider";
import { useQueryWorkspaceFiles, useUploadFile } from "./hooks";
import { WorkspaceContext } from "./provider";
import { createKey, handleAddTag, isFilenameValid } from "./utils";

export function SharedFileNew() {
  const { currentMd } = use(WorkspaceContext);
  const { addToast } = useToast();

  const uploadFile = useUploadFile();

  const [newFilename, setNewFilename] = useState("");
  const [newTags, setNewTags] = useState(new Set<string>());
  const [customErrorMessage, setCustomErrorMessage] = useState("");

  const filenameId = useId();
  const tagsId = useId();

  const { data: files = [] } = useQueryWorkspaceFiles();

  const handleSaveNewFile = () => {
    if (!newFilename.trim()) return;
    const key = createKey({ fileName: newFilename.trim(), tags: newTags });
    uploadFile.mutate(
      { key, content: currentMd },
      {
        onSuccess: () => {
          setNewFilename("");
          setNewTags(new Set());
          addToast("success", `File ${newFilename} saved`);
        },
      },
    );
  };

  const handleSetFilename = (value: string) => {
    const error = isFilenameValid(
      value,
      files.map((f) => f.Key),
    );
    setCustomErrorMessage(error);
    setNewFilename(value);
  };

  const disabled =
    Boolean(customErrorMessage) ||
    !currentMd.trim().length ||
    !newFilename.trim() ||
    uploadFile.isPending;

  return (
    <div className="border border-gray-200 rounded-sm shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3">Lagre ny</h2>
      <div className="space-y-3">
        {/* Filename Row */}
        <div className="flex items-center gap-2">
          <label htmlFor={filenameId} className="w-14 text-sm font-medium text-gray-700">
            Filename
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex">
              <input
                id={filenameId}
                type="text"
                value={newFilename}
                onChange={(e) => handleSetFilename(e.currentTarget.value)}
                placeholder="Enter filename"
                className="w-80 border border-gray-300 rounded-l px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 bg-gray-100 rounded-r border border-l-0 border-gray-300">
                .md
              </span>
            </div>
            <button
              onClick={handleSaveNewFile}
              disabled={disabled}
              title={currentMd.trim().length ? "" : "No content to save"}
              className="rounded-sm bg-green-500 px-4 py-2 text-white hover:bg-green-600 shadow-sm disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            {customErrorMessage && <div className="text-red-500 text-m">{customErrorMessage}</div>}
            {uploadFile.error && (
              <div className="text-red-500 text-m">{uploadFile.error.message}</div>
            )}
          </div>
        </div>

        {/* Tags Row */}
        <div className="flex items-center gap-2 w-full">
          <label htmlFor={tagsId} className="w-14 text-sm font-medium text-gray-700">
            Tags
          </label>
          <div className="flex items-center gap-2 flex-1">
            {/* Fixed width input */}
            <input
              id={tagsId}
              type="text"
              placeholder="Add tag"
              onBlur={(e) => {
                handleAddTag(e.currentTarget.value, newTags, setCustomErrorMessage, setNewTags);
                e.currentTarget.value = "";
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                handleAddTag(e.currentTarget.value, newTags, setCustomErrorMessage, setNewTags);
                e.currentTarget.value = "";
              }}
              className="w-32 border border-gray-300 rounded-sm px-2 py-1 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {/* Tags container that fills remaining space */}
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {Array.from(newTags).map((tag, index) => (
                <button
                  key={tag}
                  data-ignore-outside
                  title="Remove tag"
                  onClick={() =>
                    setNewTags(new Set(newTags.values().filter((_, i) => i !== index)))
                  }
                  className="inline-flex items-center rounded-sm bg-gray-200 px-2 py-1 text-sm shadow-sm whitespace-nowrap hover:bg-gray-300 hover:text-gray-800"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
