import { AzureDevOpsRepo } from "@/actions/azdo";

type Props = {
  repos: AzureDevOpsRepo[];
  onRepoSelect: (repo: AzureDevOpsRepo) => void;
};

export function RepoSelector({ repos, onRepoSelect }: Props) {
  return (
    <select
      defaultValue=""
      className="p-2 border border-gray-300 rounded"
      onChange={(e) => onRepoSelect(repos.find((r) => r.id === e.target.value)!)}
    >
      <option value="" disabled>
        Select repository
      </option>
      {repos.map((repo) => (
        <option key={repo.id} value={repo.id}>
          {repo.name}
        </option>
      ))}
    </select>
  );
}
