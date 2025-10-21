import { useState } from "react";
import { useToast } from "../toast/provider";
import { useDeleteFile, useLoadFile, useUploadFile } from "./hooks";
import { createKey, extractTags, handleAddTag, isFilenameValid } from "./utils";

interface SharedFileListItemRenameProps {
  fileKey: string;
  allFileKeys: (string | undefined)[];
  onFinished: () => void;
}

export function SharedFileListItemRename({
  fileKey,
  allFileKeys,
  onFinished,
}: SharedFileListItemRenameProps) {
  const { fileName, tags, fullName } = extractTags(fileKey);
  const { addToast } = useToast();

  const [editFilename, setEditFilename] = useState(fileName);
  const [editTags, setEditTags] = useState(tags);
  const [customErrorMessage, setCustomErrorMessage] = useState("");

  const loadFile = useLoadFile();
  const uploadFile = useUploadFile(true);
  const deleteFile = useDeleteFile();

  const handleRenameFile = async (oldKey: string) => {
    if (!editFilename.trim()) return;
    const newKey = createKey({ fileName: editFilename.trim(), tags: editTags });
    const file = await loadFile.mutateAsync(oldKey);
    await uploadFile.mutateAsync(
      { key: newKey, content: file.md },
      {
        onSuccess: async () => {
          await deleteFile.mutateAsync(oldKey);
          onFinished();
          const { fileName } = extractTags(oldKey);
          addToast("success", `File ${fileName} renamed to ${editFilename}`);
        },
      },
    );
  };

  const handleSetFilename = (value: string) => {
    const error = isFilenameValid(value, allFileKeys);
    setCustomErrorMessage(error);
    setEditFilename(value);
  };

  // hande old keys without fullName in addition to new format
  const areFilenameAndTagsUnchanged =
    fileKey === createKey({ fileName: editFilename, tags: editTags }) ||
    fileKey === createKey({ fileName: editFilename, tags: editTags, fullName });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="w-24 text-sm font-medium text-gray-700">New Filename:</label>
        <div className="relative flex">
          <input
            type="text"
            value={editFilename}
            onChange={(e) => handleSetFilename(e.target.value)}
            className="w-80 border border-gray-300 rounded-l px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 bg-gray-100 rounded-r border border-l-0 border-gray-300">
            .md
          </span>
        </div>
        {customErrorMessage && <div className="text-red-500 text-m">{customErrorMessage}</div>}
        {uploadFile.error && <div className="text-red-500 text-m">{uploadFile.error.message}</div>}
        {deleteFile.error && <div className="text-red-500 text-m">{deleteFile.error.message}</div>}
      </div>
      <div className="flex items-center gap-2">
        <label className="w-24 text-sm font-medium text-gray-700">Tags:</label>
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Add tag"
            onBlur={(e) => {
              handleAddTag(e.currentTarget.value, editTags, setCustomErrorMessage, setEditTags);
              e.currentTarget.value = "";
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              handleAddTag(e.currentTarget.value, editTags, setCustomErrorMessage, setEditTags);
              e.currentTarget.value = "";
            }}
            className="w-32 border border-gray-300 rounded-sm px-2 py-1 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {Array.from(editTags).map((tag, index) => (
              <button
                key={index}
                data-ignore-outside
                title="Remove tag"
                onClick={() =>
                  setEditTags(new Set(Array.from(editTags).filter((_, i) => i !== index)))
                }
                className="inline-flex items-center rounded-sm bg-gray-200 border border-gray-300 px-2 py-1 text-sm shadow-sm whitespace-nowrap hover:bg-gray-300 hover:text-gray-800"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          data-ignore-outside
          className="rounded-sm bg-green-500 px-4 py-2 text-white hover:bg-green-600 shadow-sm disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleRenameFile(fileKey)}
          disabled={Boolean(customErrorMessage) || areFilenameAndTagsUnchanged}
        >
          Save Rename
        </button>
        <button
          data-ignore-outside
          className="rounded-sm bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 shadow-sm"
          onClick={onFinished}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
