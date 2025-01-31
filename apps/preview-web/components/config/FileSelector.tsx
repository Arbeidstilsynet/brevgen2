import { AzureDevOpsRepo } from "@/actions/azdo";
import { useGetMarkdownFilesInfo } from "./useGetMarkdownFilesInfo";

type Props = Readonly<{
  repo: AzureDevOpsRepo;
  branch: string;
  onFileSelect: (repoId: string, branch: string, filePath: string) => void;
}>;

export function FileSelector({ repo, branch, onFileSelect }: Props) {
  const { data, isLoading } = useGetMarkdownFilesInfo(repo, branch);

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
          <li key={file.path}>
            <button
              title={file.path}
              className="p-2 border border-gray-300 rounded hover:bg-gray-200 w-full text-left"
              onClick={() => onFileSelect(repo.id, branch, file.path)}
            >
              {file.path.split("/").at(-1)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
