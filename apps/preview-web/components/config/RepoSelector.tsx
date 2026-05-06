import { AzureDevOpsRepo } from "@/actions/azdo";
import { GitHubRepo } from "@/actions/github";
import Image from "next/image";
import { useMemo } from "react";
import { type ComboboxOption, SelectCombobox } from "../SelectCombobox";
import { allowedAzDoRepos, allowedGitHubRepos, RepoWithName } from "./selectableRepos";

const GitHubIcon = <Image src="/github.svg" alt="GitHub" width={16} height={16} />;
const AzureDevOpsIcon = <Image src="/azdo.svg" alt="Azure DevOps" width={16} height={16} />;

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
  const repoOptions: RepoWithName[] = useMemo(
    () =>
      [
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
      ].toSorted((a, b) => a.prettyName.localeCompare(b.prettyName)),
    [azdoRepos, githubRepos],
  );

  const comboboxOptions: ComboboxOption[] = useMemo(
    () =>
      repoOptions.map((r) => ({
        value: r.prettyName,
        label: r.prettyName,
        icon: r.provider === "github" ? GitHubIcon : AzureDevOpsIcon,
      })),
    [repoOptions],
  );

  return (
    <div className="flex flex-col gap-1">
      <SelectCombobox
        label="Fagsystem"
        options={comboboxOptions}
        value={selectedRepoPrettyName}
        onChange={(val) => {
          const repo = repoOptions.find((r) => r.prettyName === val);
          if (repo) onRepoSelected(repo);
        }}
        placeholder="Velg fagsystem"
        disabled={disabled}
      />
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
