import { AzureDevOpsFile, fetchFilesFromAzure } from "@/actions/azdo";
import { fetchFilesFromGitHub, GitHubFile } from "@/actions/github";
import { useQuery } from "@tanstack/react-query";
import type { RepoWithName } from "./selectableRepos";
import { isFileAllowed } from "./utils";

interface FileInfo {
  path: string;
  size?: number;
}

export function useGetMarkdownFilesInfo(repoWithName: RepoWithName, branch: string) {
  return useQuery<FileInfo[]>({
    queryKey: ["files", repoWithName.provider, repoWithName.repo.name, branch],
    queryFn: async () => {
      if (repoWithName.provider === "azdo") {
        const data = await fetchFilesFromAzure(repoWithName.repoInfo.id, branch);
        return data.map((f: AzureDevOpsFile) => ({ path: f.path, size: f.size }));
      }
      const data = await fetchFilesFromGitHub(repoWithName.repo.name, branch);
      return data.map((f: GitHubFile) => ({ path: f.path, size: f.size }));
    },
    select: (data) =>
      data.filter((file) =>
        isFileAllowed({
          repoName: repoWithName.repo.name,
          prettyName: repoWithName.prettyName,
          path: file.path,
        }),
      ),
  });
}
