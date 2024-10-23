import { AzureDevOpsFile, fetchFilesFromAzure } from "@/actions/azdo";
import { useQuery } from "@tanstack/react-query";
import { selectableRepos } from "./selectableRepos";

const isRepoChooseable = (repoName: string): repoName is keyof typeof selectableRepos =>
  repoName in selectableRepos;

const isMarkdownFile = (path: string): boolean => path.endsWith(".md") || path.endsWith(".mdat");

function isPathAllowed(repoName: keyof typeof selectableRepos, path: string): boolean {
  if (!selectableRepos[repoName].onlyPaths) {
    return true;
  }
  return selectableRepos[repoName].onlyPaths.some((p) => path.includes(p));
}

type Props = {
  repoId: string;
  repoName: string;
  branch: string;
  onFileSelect: (repoId: string, branch: string, filePath: string) => void;
};

export function FileSelector({ repoId, repoName, branch, onFileSelect }: Props) {
  const { data: files = [], isLoading } = useQuery<AzureDevOpsFile[]>({
    queryKey: ["files", repoId, branch],
    queryFn: () => fetchFilesFromAzure(repoId, branch),
    select: (data) =>
      data.filter(
        (file) =>
          isRepoChooseable(repoName) &&
          isMarkdownFile(file.path) &&
          isPathAllowed(repoName, file.path),
      ),
  });

  if (isLoading) {
    return <div>Laster filer...</div>;
  }

  if (files.length === 0) {
    return <div>Ingen filer funnet</div>;
  }

  return (
    <div>
      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.path}>
            <button
              className="p-2 border border-gray-300 rounded hover:bg-gray-200 w-full text-left"
              onClick={() => onFileSelect(repoId, branch, file.path)}
            >
              {file.path}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
