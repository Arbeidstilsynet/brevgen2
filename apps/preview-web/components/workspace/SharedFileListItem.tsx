import { use, useEffect, useRef, useState } from "react";
import { useToast } from "../toast/provider";
import { useDeleteFile, useLoadFile, useUploadFile } from "./hooks";
import { WorkspaceContext } from "./provider";
import { SharedFileListItemRename } from "./SharedFileListItemRename";
import { extractTags, handleCopyUrlWorkspace } from "./utils";

interface SharedFileListItemProps {
  fileKey: string;
  allFileKeys: (string | undefined)[];
}

export function SharedFileListItem({ fileKey, allFileKeys }: Readonly<SharedFileListItemProps>) {
  const { currentMd, onLoadMd } = use(WorkspaceContext);
  const { addToast } = useToast();

  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "overwrite" | "delete">(null);
  const [isEditing, setIsRenaming] = useState(false);

  const loadFile = useLoadFile();
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();

  // Close the context menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleConfirmYes = () => {
    const onSuccess = () => {
      setShowMenu(false);
      setConfirmAction(null);
      let toastMessage = "";
      const { fileName } = extractTags(fileKey);
      if (confirmAction === "overwrite") toastMessage = `File ${fileName} overwritten`;
      if (confirmAction === "delete") toastMessage = `File ${fileName} deleted`;
      addToast("success", toastMessage);
    };

    if (confirmAction === "overwrite") {
      uploadFile.mutate({ key: fileKey, content: currentMd }, { onSuccess });
    } else if (confirmAction === "delete") {
      deleteFile.mutate(fileKey, { onSuccess });
    }
  };

  const handleLoadFile = (key: string) => {
    loadFile.mutate(key, {
      onSuccess: (data) => {
        if (!data) return console.error(`File was empty`);
        const { fileName } = extractTags(key);
        onLoadMd(data, fileName);
      },
    });
  };

  const { fileName, tags } = extractTags(fileKey);
  const disabled = uploadFile.isPending || deleteFile.isPending || loadFile.isPending;

  return (
    <li key={fileKey} className="border p-3 rounded hover:shadow-md">
      {!isEditing && (
        <div className="flex justify-between items-center">
          <button
            className="p-2 mr-2 border border-gray-300 rounded hover:bg-gray-200 w-full text-left"
            onClick={() => handleLoadFile(fileKey)}
            disabled={disabled}
          >
            <span className="font-medium">{fileName}</span>
            <span className="text-gray-500 ml-1">.md</span>
            {Array.from(tags).map((tag, index) => (
              <span
                key={index}
                className="ml-2 inline-flex items-center rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-xs text-blue-800 shadow"
              >
                {tag}
              </span>
            ))}
          </button>
          {loadFile.error && <div className="text-red-500 text-m">{loadFile.error.message}</div>}
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await handleCopyUrlWorkspace(fileKey);
                addToast("success", "Permanent URL copied to clipboard");
              }}
              className="rounded bg-indigo-500 p-2 text-white hover:bg-indigo-600 shadow disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
              title="Copy permanent URL"
            >
              {/* Clipboard icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7h8m-8 4h8m-8 4h8M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                />
              </svg>
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  setShowMenu(!showMenu);
                  setConfirmAction(null);
                }}
                className="p-2 rounded hover:bg-gray-200 disabled:cursor-not-allowed"
                disabled={disabled}
              >
                {/* Three dots icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v.01M12 12v.01M12 18v.01"
                  />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-40 rounded shadow-lg bg-white border z-10">
                  {confirmAction ? (
                    <div className="px-4 py-2" data-ignore-outside>
                      <p className="text-sm mb-2">Are you sure you want to {confirmAction}?</p>
                      <div className="flex justify-between gap-2">
                        <button
                          onClick={handleConfirmYes}
                          className="text-green-600 hover:text-green-800 text-m"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmAction(null)}
                          className="text-red-600 hover:text-red-800 text-m"
                        >
                          No
                        </button>
                      </div>
                      {uploadFile.error && (
                        <div className="text-red-500 text-m">{uploadFile.error.message}</div>
                      )}
                      {deleteFile.error && (
                        <div className="text-red-500 text-m">{deleteFile.error.message}</div>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        data-ignore-outside
                        onClick={() => {
                          setIsRenaming(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Rename
                      </button>
                      <button
                        data-ignore-outside
                        onClick={() => setConfirmAction("overwrite")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Overwrite
                      </button>
                      <button
                        data-ignore-outside
                        onClick={() => setConfirmAction("delete")}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <SharedFileListItemRename
          fileKey={fileKey}
          allFileKeys={allFileKeys}
          onFinished={() => setIsRenaming(false)}
        />
      )}
    </li>
  );
}
