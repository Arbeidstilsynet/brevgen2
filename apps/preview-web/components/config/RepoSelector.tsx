import { AzureDevOpsRepo } from "@/actions/azdo";
import { allowedRepoNames, allowedRepos } from "./selectableRepos";

type Props = Readonly<{
  repos: AzureDevOpsRepo[];
  selected: AzureDevOpsRepo | null;
  onRepoSelect: (repo: AzureDevOpsRepo) => void;
}>;

export function RepoSelector({ repos, selected, onRepoSelect }: Props) {
  const filteredRepos = repos
    .filter((repo) => allowedRepoNames.has(repo.name))
    .map((r) => ({
      id: r.id,
      name: allowedRepos.find((s) => s.repoName === r.name)!.prettyName,
    }));

  return (
    <select
      className="p-2 border border-gray-300 rounded"
      value={selected?.id ?? ""}
      onChange={(e) => onRepoSelect(repos.find((r) => r.id === e.target.value)!)}
    >
      <option value={""} disabled>
        Velg fagsystem
      </option>
      {filteredRepos.map((repo) => (
        <option key={repo.id} value={repo.id}>
          {repo.name}
        </option>
      ))}
    </select>
  );
}
