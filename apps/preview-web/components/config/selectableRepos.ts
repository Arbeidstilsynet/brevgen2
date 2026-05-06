import { AzureDevOpsRepo } from "@/actions/azdo";
import { GitHubRepo } from "@/actions/github";

interface BaseRepoInfo {
  /**
   * Name of the Git repository
   */
  repoName: string;
  /**
   * Pretty name of the selection
   */
  prettyName: string;
  /**
   * Restrict file options to these paths
   */
  onlyPaths: string[];
}

export interface AzDoRepoInfo extends BaseRepoInfo {
  provider: "azdo";
  /**
   * Id of the Azure DevOps Git repository
   */
  id: string;
}

export interface GitHubRepoInfo extends BaseRepoInfo {
  provider: "github";
}

export type RepoInfo = AzDoRepoInfo | GitHubRepoInfo;

export const allowedRepos: RepoInfo[] = (
  [
    {
      provider: "azdo",
      id: "4914f041-a899-4900-b228-8ca96122fb45",
      repoName: "era",
      prettyName: "Bemanning",
      onlyPaths: ["apps/bemanning-saksbehandling/dokumentmaler"],
    },
    {
      provider: "azdo",
      id: "4914f041-a899-4900-b228-8ca96122fb45",
      repoName: "era",
      prettyName: "Bilpleie",
      onlyPaths: ["apps/bilpleie-saksbehandling/dokumentmaler"],
    },
    {
      provider: "azdo",
      id: "cb3181b5-a126-4519-99cb-bb941ccd79b3",
      repoName: "arbeidstid-service",
      prettyName: "Arbeidstid",
      onlyPaths: ["dokumentmaler"],
    },
    {
      provider: "azdo",
      id: "a0c5d4c8-d5a3-46f2-9d59-54ecebddb62a",
      repoName: "yrkeskvalifikasjon-monorepo",
      prettyName: "Yrkeskvalifikasjon",
      onlyPaths: ["dokumentmaler"],
    },
    {
      provider: "azdo",
      id: "48e8d8a9-0bed-4f83-811e-f02ecca059ac",
      repoName: "asbest-melding",
      prettyName: "Asbest melding",
      onlyPaths: ["BrevTjeneste/Brevmaler"],
    },
    {
      provider: "azdo",
      id: "5a6eba39-5583-47b0-8c07-0f40b71c38c3",
      repoName: "asbest-saksbehandling",
      prettyName: "Asbest",
      onlyPaths: ["src/RegistrerSøknad/SendKvittering/Brevmaler"],
    },
    {
      provider: "github",
      repoName: "brevgen2",
      prettyName: "Brevgen2 (GitHub)",
      onlyPaths: ["apps/preview-web/examples"],
    },
  ] satisfies RepoInfo[]
).toSorted((a, b) => a.prettyName.localeCompare(b.prettyName));

export const allowedAzDoRepos = allowedRepos.filter(
  (r): r is AzDoRepoInfo => r.provider === "azdo",
);
export const allowedGitHubRepos = allowedRepos.filter(
  (r): r is GitHubRepoInfo => r.provider === "github",
);

export const allowedRepoNames = new Set(allowedRepos.map((r) => r.repoName));

export type AzDoRepoWithName = Readonly<[azDoRepo: AzureDevOpsRepo, prettyName: string]>;
export type GitHubRepoWithName = Readonly<[ghRepo: GitHubRepo, prettyName: string]>;
export type RepoWithName = Readonly<
  | { provider: "azdo"; repo: AzureDevOpsRepo; prettyName: string; repoInfo: AzDoRepoInfo }
  | { provider: "github"; repo: GitHubRepo; prettyName: string; repoInfo: GitHubRepoInfo }
>;
