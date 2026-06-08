import type { Repo } from "@/actions/git-provider/types";
import Image from "next/image";
import { type ComboboxOption, SelectCombobox } from "../SelectCombobox";
import { allowedRepos, type RepoInfo, type RepoWithName } from "./allowedRepos";

const GitHubIcon = <Image src="/github.svg" alt="GitHub" width={16} height={16} />;
const AzureDevOpsIcon = <Image src="/azdo.svg" alt="Azure DevOps" width={16} height={16} />;

function matchRepos(actualRepos: Repo[], provider: RepoInfo["provider"]): RepoWithName[] {
  return allowedRepos
    .filter((info) => info.provider === provider)
    .flatMap((info) => {
      const repo = actualRepos.find((r) => r.name === info.repoName);
      if (!repo) return [];
      return [{ provider, repo, prettyName: info.prettyName, repoInfo: info }];
    });
}

type Props = Readonly<{
  azdoRepos: Repo[];
  githubRepos: Repo[];
  selectedRepoPrettyName: string | null;
  onRepoSelected: (repo: RepoWithName) => void;
  disabled?: boolean;
  azdoError?: string | null;
  githubError?: string | null;
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
  const repoOptions = [
    ...matchRepos(azdoRepos, "azdo"),
    ...matchRepos(githubRepos, "github"),
  ].toSorted((a, b) => a.prettyName.localeCompare(b.prettyName));

  const comboboxOptions: ComboboxOption[] = repoOptions.map((r) => ({
    value: r.prettyName,
    label: r.prettyName,
    icon: r.provider === "github" ? GitHubIcon : AzureDevOpsIcon,
  }));

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
          <p>{azdoError}</p>
        </div>
      )}
      {githubError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Kunne ikke hente GitHub-repos</p>
          <p>{githubError}</p>
        </div>
      )}
    </div>
  );
}
