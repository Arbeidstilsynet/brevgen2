import { AzureDevOpsFile, fetchFilesFromAzure } from "@/actions/azdo";
import { useEffect, useState } from "react";
import { selectableRepos } from "./selectableRepos";

function isRepoChooseable(repoName: string): repoName is keyof typeof selectableRepos {
  return repoName in selectableRepos;
}

function isFilepathAllowed(repoName: keyof typeof selectableRepos, path: string) {
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
  const [files, setFiles] = useState<AzureDevOpsFile[]>([]);

  useEffect(() => {
    setFiles([]); // ikke vis filer for forrige repo ved bytte

    const fetchFiles = async () => {
      const response = await fetchFilesFromAzure(repoId, branch);

      // Filter to only include (dynamic) markdown files
      setFiles(
        response.filter(
          (file) =>
            isRepoChooseable(repoName) &&
            (file.path.endsWith(".md") || file.path.endsWith(".mdat")) &&
            isFilepathAllowed(repoName, file.path),
        ),
      );
    };
    fetchFiles();
  }, [branch, repoId, repoName]);

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
