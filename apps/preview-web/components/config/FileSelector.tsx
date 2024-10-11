import { AzureDevOpsFile, fetchFilesFromAzure } from "@/actions/azdo";
import { useEffect, useState } from "react";

type Props = {
  repoId: string;
  branch: string;
  onFileSelect: (repoId: string, branch: string, filePath: string) => void;
};

export function FileSelector({ repoId, branch, onFileSelect }: Props) {
  const [files, setFiles] = useState<AzureDevOpsFile[]>([]);

  useEffect(() => {
    setFiles([]); // ikke vis filer for forrige repo ved bytte

    const fetchFiles = async () => {
      const response = await fetchFilesFromAzure(repoId, branch);

      // Filter to only include (dynamic) markdown files
      setFiles(response.filter((file) => file.path.endsWith(".md") || file.path.endsWith(".mdat")));
    };
    fetchFiles();
  }, [branch, repoId]);

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
