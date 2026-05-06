import { AzureDevOpsRepo } from "@/actions/azdo";
import { GitHubRepo } from "@/actions/github";
import { allowedAzDoRepos, allowedGitHubRepos, RepoWithName } from "./selectableRepos";

type Props = Readonly<{
  azdoRepos: AzureDevOpsRepo[];
  githubRepos: GitHubRepo[];
  selectedRepoPrettyName: string | null;
  onRepoSelected: (repo: RepoWithName) => void;
  disabled?: boolean;
  azdoError?: boolean;
  githubError?: boolean;
}>;

export function RepoSelector({
  azdoRepos,
  githubRepos,
  selectedRepoPrettyName,
  onRepoSelected,
  disabled,
  azdoError,
  githubError,
}: Props) {
  const repoOptions: RepoWithName[] = [
    ...allowedAzDoRepos
      .map((info) => {
        const actualRepo = azdoRepos.find((repo) => repo.name === info.repoName);
        if (!actualRepo) return null;
        return {
          provider: "azdo" as const,
          repo: actualRepo,
          prettyName: info.prettyName,
          repoInfo: info,
        };
      })
      .filter((r): r is NonNullable<typeof r> => Boolean(r)),
    ...allowedGitHubRepos
      .map((info) => {
        const actualRepo = githubRepos.find((repo) => repo.name === info.repoName);
        if (!actualRepo) return null;
        return {
          provider: "github" as const,
          repo: actualRepo,
          prettyName: info.prettyName,
          repoInfo: info,
        };
      })
      .filter((r): r is NonNullable<typeof r> => Boolean(r)),
  ].toSorted((a, b) => a.prettyName.localeCompare(b.prettyName));

  const base =
    "p-2 border rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm";
  const enabledClasses = "border-gray-300 bg-white";
  const disabledClasses = "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed opacity-60";

  return (
    <div className="flex flex-col gap-1">
      <select
        className={`${base} ${disabled ? disabledClasses : enabledClasses}`}
        value={selectedRepoPrettyName ?? ""}
        onChange={(e) => onRepoSelected(repoOptions.find((r) => r.prettyName === e.target.value)!)}
        disabled={disabled}
      >
        <option value={""} disabled>
          Velg fagsystem
        </option>
        {repoOptions.map((repo) => (
          <option key={repo.prettyName} value={repo.prettyName}>
            {repo.prettyName}
          </option>
        ))}
      </select>
      {azdoError && (
        <span className="text-xs text-amber-700">
          Kunne ikke hente Azure DevOps-repos (sjekk PAT)
        </span>
      )}
      {githubError && (
        <span className="text-xs text-amber-700">Kunne ikke hente GitHub-repos (sjekk PAT)</span>
      )}
    </div>
  );
}
