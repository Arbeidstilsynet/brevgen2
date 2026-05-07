import { fetchFilesFromAzure } from "@/actions/azdo";
import { fetchFilesFromGitHub } from "@/actions/github";
import { useQuery } from "@tanstack/react-query";
import type { RepoWithName } from "./allowedRepos";
import { isFileAllowed } from "./utils";

interface FileInfo {
  path: string;
}

export function useGetMarkdownFilesInfo(repoWithName: RepoWithName, branch: string) {
  return useQuery<FileInfo[]>({
    queryKey: ["files", repoWithName.provider, repoWithName.repo.name, branch],
    queryFn: async () => {
      if (repoWithName.provider === "azdo") {
        return await fetchFilesFromAzure(repoWithName.repoInfo.id, branch);
      }
      return await fetchFilesFromGitHub(repoWithName.repo.name, branch);
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
