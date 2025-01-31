import { AzureDevOpsFile, AzureDevOpsRepo, fetchFilesFromAzure } from "@/actions/azdo";
import { useQuery } from "@tanstack/react-query";
import { isAzDoFileAllowed } from "./utils";

export function useGetMarkdownFilesInfo(repo: AzureDevOpsRepo, branch: string) {
  return useQuery<AzureDevOpsFile[]>({
    queryKey: ["files", repo.id, branch],
    queryFn: () => fetchFilesFromAzure(repo.id, branch),
    select: (data) => data.filter((file) => isAzDoFileAllowed(repo.name, file.path)),
  });
}
