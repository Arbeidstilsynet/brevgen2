import { AzureDevOpsRepo } from "@/actions/azdo";
import { allowedRepos, AzDoRepoWithName } from "./selectableRepos";

type Props = Readonly<{
  repos: AzureDevOpsRepo[];
  selectedRepoName: string | null;
  onRepoSelected: (repo: AzDoRepoWithName) => void;
  disabled?: boolean;
}>;

export function RepoSelector({ repos, selectedRepoName, onRepoSelected, disabled }: Props) {
  const reposOptions: AzDoRepoWithName[] = allowedRepos
    .map((allowedRepo) => {
      const actualRepo = repos.find((repo) => repo.name === allowedRepo.repoName);
      return actualRepo ? ([actualRepo, allowedRepo.prettyName] as const) : null;
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const base =
    "p-2 border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm";
  const enabledClasses = "border-gray-300 bg-white";
  const disabledClasses = "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed opacity-60";

  return (
    <select
      className={`${base} ${disabled ? disabledClasses : enabledClasses}`}
      value={selectedRepoName ?? ""}
      onChange={(e) => onRepoSelected(reposOptions.find((r) => r[1] === e.target.value)!)}
      disabled={disabled}
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
