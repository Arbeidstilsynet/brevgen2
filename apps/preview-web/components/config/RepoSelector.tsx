import { AzureDevOpsRepo } from "@/actions/azdo";
import { GitHubRepo } from "@/actions/github";
import Image from "next/image";
import { useMemo } from "react";
import { type ComboboxOption, SelectCombobox } from "../SelectCombobox";
import {
  allowedAzDoRepos,
  allowedGitHubRepos,
  type AzDoRepoInfo,
  type GitHubRepoInfo,
  type RepoWithName,
} from "./allowedRepos";

const GitHubIcon = <Image src="/github.svg" alt="GitHub" width={16} height={16} />;
const AzureDevOpsIcon = <Image src="/azdo.svg" alt="Azure DevOps" width={16} height={16} />;

function matchRepos<P extends "azdo" | "github">(
  allowedRepos: (P extends "azdo" ? AzDoRepoInfo : GitHubRepoInfo)[],
  actualRepos: (P extends "azdo" ? AzureDevOpsRepo : GitHubRepo)[],
  provider: P,
): RepoWithName[] {
  return allowedRepos.flatMap((info) => {
    const repo = actualRepos.find((r) => r.name === info.repoName);
    if (!repo) return [];
    return [{ provider, repo, prettyName: info.prettyName, repoInfo: info } as RepoWithName];
  });
}

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
  const repoOptions = useMemo(
    () =>
      [
        ...matchRepos(allowedAzDoRepos, azdoRepos, "azdo"),
        ...matchRepos(allowedGitHubRepos, githubRepos, "github"),
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
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Kunne ikke hente Azure DevOps-repos</p>
          <p>Sjekk at PAT er gyldig og har tilgang</p>
        </div>
      )}
      {githubError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Kunne ikke hente GitHub-repos</p>
          <p>Sjekk at GitHub App eller PAT er konfigurert</p>
        </div>
      )}
    </div>
  );
}
