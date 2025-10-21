import { use, useEffect, useRef, useState } from "react";
import { useToast } from "../toast/provider";
import { FileTag } from "./FileTag";
import { useDeleteFile, useLoadFile, useUploadFile } from "./hooks";
import { ProfileIcon } from "./ProfileIcon";
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
      onSuccess: (file) => {
        const { md, fileName, tags } = file;
        onLoadMd(md, fileName, tags);
      },
    });
  };

  const { fileName, tags, fullName } = extractTags(fileKey);
  const disabled = uploadFile.isPending || deleteFile.isPending || loadFile.isPending;

  // Build accessible label for list item
  const tagsLabel = tags.size > 0 ? `, Tags: ${Array.from(tags).join(", ")}` : "";
  const userLabel = fullName ? `, Last changed by ${fullName}` : "";
  const listItemLabel = `${fileName}.md${tagsLabel}${userLabel}`;

  return (
    <li
      key={fileKey}
      className="p-3 border border-gray-200 rounded-sm hover:shadow-md"
      aria-label={listItemLabel}
    >
      {!isEditing && (
        <div className="flex justify-between items-center">
          <button
            className="p-2 mr-2 border border-gray-300 rounded-sm hover:bg-gray-200 w-full text-left"
            onClick={() => handleLoadFile(fileKey)}
            disabled={disabled}
            aria-label={`Load ${fileName}`}
          >
            <span className="font-medium" aria-hidden="true">
              {fileName}
            </span>
            <span className="text-gray-500 ml-1" aria-hidden="true">
              .md
            </span>
            {Array.from(tags).map((tag) => (
              <FileTag key={tag} tag={tag} aria-hidden={true} />
            ))}
          </button>
          {loadFile.error && <div className="text-red-500 text-m">{loadFile.error.message}</div>}

          <div className="flex gap-2 items-center">
            <ProfileIcon fullName={fullName} />
            <button
              onClick={async () => {
                await handleCopyUrlWorkspace(fileKey);
                addToast("success", "Permanent URL copied to clipboard");
              }}
              className="rounded-sm bg-indigo-500 p-2 text-white hover:bg-indigo-600 shadow-sm disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
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
                className="p-2 rounded-sm hover:bg-gray-200 disabled:cursor-not-allowed"
                disabled={disabled}
                title="Show context menu"
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
                <div className="absolute right-0 mt-2 w-40 rounded-sm shadow-lg bg-white border border-gray-200 z-10">
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
