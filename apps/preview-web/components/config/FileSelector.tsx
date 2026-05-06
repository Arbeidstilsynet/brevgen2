import type { GitProvider } from "@/utils/types";
import { ErrorDetails } from "../ErrorDetails";
import { useToast } from "../toast/provider";
import type { RepoWithName } from "./selectableRepos";
import { useGetMarkdownFilesInfo } from "./useGetMarkdownFilesInfo";
import { handleCopyUrl } from "./utils";

type Props = Readonly<{
  repoWithName: RepoWithName;
  branch: string;
  onFileSelected: (
    provider: GitProvider,
    repoIdentifier: string,
    branch: string,
    filePath: string,
    systemName: string,
  ) => void | Promise<void>;
}>;

export function FileSelector({ repoWithName, branch, onFileSelected }: Props) {
  const { data, isLoading, error } = useGetMarkdownFilesInfo(repoWithName, branch);
  const { addToast } = useToast();

  if (error) {
    return <ErrorDetails error={error} label="Kunne ikke hente filer" />;
  }

  if (isLoading) {
    return <div>Laster filer...</div>;
  }

  if (!data?.length) {
    return <div>Ingen filer funnet</div>;
  }

  const repoIdentifier =
    repoWithName.provider === "azdo" ? repoWithName.repoInfo.id : repoWithName.repo.full_name;

  return (
    <div>
      <ul className="space-y-2">
        {data.map((file) => (
          <li key={file.path} className="flex flex-row">
            <button
              title={file.path}
              className="p-2 mr-2 border border-gray-300 rounded-sm hover:bg-gray-200 w-full text-left"
              onClick={() =>
                onFileSelected(
                  repoWithName.provider,
                  repoIdentifier,
                  branch,
                  file.path,
                  repoWithName.prettyName,
                )
              }
            >
              {file.path.split("/").at(-1)}
            </button>
            <button
              onClick={async () => {
                await handleCopyUrl(repoWithName.provider, repoIdentifier, branch, file.path);
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
          </li>
        ))}
      </ul>
    </div>
  );
}
