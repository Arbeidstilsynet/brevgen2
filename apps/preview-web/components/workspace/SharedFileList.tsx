import { Fragment } from "react";
import { SharedFileListItem } from "./SharedFileListItem";
import { useQueryWorkspaceFiles } from "./hooks";

export function SharedFileList() {
  const { data: files = [], isLoading, isSuccess, error } = useQueryWorkspaceFiles();

  return (
    <div className="border border-gray-200 rounded-sm shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3">Filer</h2>

      {isLoading && <p>Loading...</p>}
      {error && <div className="text-red-500 text-m">{error.toString()}</div>}

      {isSuccess && (
        <ul className="space-y-3">
          {files.map((file) => (
            <Fragment key={file.Key}>
              {!file.Key ? (
                <li className="border border-gray-200 p-3 text-red-500 rounded-sm hover:shadow-md">
                  Error: File key is empty
                </li>
              ) : (
                <SharedFileListItem fileKey={file.Key} allFileKeys={files.map((f) => f.Key)} />
              )}
            </Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}
