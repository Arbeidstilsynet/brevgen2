import { AzureDevOpsFile, fetchFilesFromAzure } from "@/actions/azdo";
import { useQuery } from "@tanstack/react-query";
import { AzDoRepoWithName } from "./selectableRepos";
import { isAzDoFileAllowed } from "./utils";

export function useGetMarkdownFilesInfo(repoWithName: AzDoRepoWithName, branch: string) {
  const [repo, prettyName] = repoWithName;
  return useQuery<AzureDevOpsFile[]>({
    queryKey: ["files", repo.id, branch],
    queryFn: () => fetchFilesFromAzure(repo.id, branch),
    select: (data) =>
      data.filter((file) =>
        isAzDoFileAllowed({ repoName: repo.name, prettyName, path: file.path }),
      ),
  });
}
