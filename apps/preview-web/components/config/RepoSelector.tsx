import { AzureDevOpsRepo } from "@/actions/azdo";
import { selectableRepos } from "./selectableRepos";

type Props = {
  repos: AzureDevOpsRepo[];
  onRepoSelect: (repo: AzureDevOpsRepo) => void;
};

export function RepoSelector({ repos, onRepoSelect }: Props) {
  const filteredRepos = repos
    .filter((repo) => repo.name in selectableRepos)
    .map((r) => ({
      id: r.id,
      name: selectableRepos[r.name as keyof typeof selectableRepos].prettyName,
    }));

  return (
    <select
      defaultValue=""
      className="p-2 border border-gray-300 rounded"
      onChange={(e) => onRepoSelect(repos.find((r) => r.id === e.target.value)!)}
    >
      <option value="" disabled>
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
