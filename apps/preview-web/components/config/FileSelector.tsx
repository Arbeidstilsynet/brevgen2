import { AzureDevOpsRepo } from "@/actions/azdo";
import { useToast } from "../toast/provider";
import { useGetMarkdownFilesInfo } from "./useGetMarkdownFilesInfo";
import { handleCopyUrlGit } from "./utils";

type Props = Readonly<{
  repo: AzureDevOpsRepo;
  branch: string;
  onFileSelect: (repoId: string, branch: string, filePath: string) => void | Promise<void>;
}>;

export function FileSelector({ repo, branch, onFileSelect }: Props) {
  const { data, isLoading } = useGetMarkdownFilesInfo(repo, branch);
  const { addToast } = useToast();

  if (isLoading) {
    return <div>Laster filer...</div>;
  }

  if (!data?.length) {
    return <div>Ingen filer funnet</div>;
  }

  return (
    <div>
      <ul className="space-y-2">
        {data.map((file) => (
          <li key={file.path} className="flex flex-row">
            <button
              title={file.path}
              className="p-2 mr-2 border border-gray-300 rounded hover:bg-gray-200 w-full text-left"
              onClick={() => onFileSelect(repo.id, branch, file.path)}
            >
              {file.path.split("/").at(-1)}
            </button>
            <button
              onClick={async () => {
                await handleCopyUrlGit(repo.id, branch, file.path);
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
          </li>
        ))}
      </ul>
    </div>
  );
}
