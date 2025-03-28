import { AzureDevOpsRepo } from "@/actions/azdo";
import { allowedRepos, AzDoRepoWithName } from "./selectableRepos";

type Props = Readonly<{
  repos: AzureDevOpsRepo[];
  selectedRepoName: string | null;
  onRepoSelected: (repo: AzDoRepoWithName) => void;
}>;

export function RepoSelector({ repos, selectedRepoName, onRepoSelected }: Props) {
  const reposOptions: AzDoRepoWithName[] = allowedRepos
    .map((allowedRepo) => {
      const actualRepo = repos.find((repo) => repo.name === allowedRepo.repoName);
      return actualRepo ? ([actualRepo, allowedRepo.prettyName] as const) : null;
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  return (
    <select
      className="p-2 border border-gray-300 rounded-sm"
      value={selectedRepoName ?? ""}
      onChange={(e) => onRepoSelected(reposOptions.find((r) => r[1] === e.target.value)!)}
    >
      <option value={""} disabled>
        Velg fagsystem
      </option>
      {reposOptions.map((repo) => (
        <option key={repo[1]} value={repo[1]}>
          {repo[1]}
        </option>
      ))}
    </select>
  );
}
