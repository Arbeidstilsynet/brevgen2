import { listFiles } from "@/actions/git";
import type { RepoFile } from "@/actions/git-provider/types";
import { useQuery } from "@tanstack/react-query";
import type { RepoWithName } from "./allowedRepos";
import { isFileAllowed } from "./utils";

export function useGetMarkdownFilesInfo(repoWithName: RepoWithName, branch: string) {
  return useQuery<RepoFile[]>({
    queryKey: ["files", repoWithName.provider, repoWithName.repo.id, branch],
    queryFn: () => listFiles(repoWithName.provider, repoWithName.repo.id, branch),
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
