import { AzureDevOpsRepo } from "@/actions/azdo";

interface RepoInfo {
  /**
   * Id of the Git repository
   */
  id: string;
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

export const allowedRepos: RepoInfo[] = [
  {
    id: "95900fce-b90e-44b1-ab49-36043c6c1c00",
    repoName: "felles-brevgenerator",
    prettyName: "Brevgenerator2 (eksempler)",
    onlyPaths: ["apps/preview-web/examples"],
  },
  {
    id: "4914f041-a899-4900-b228-8ca96122fb45",
    repoName: "era",
    prettyName: "Bemanning",
    onlyPaths: ["apps/bemanning-saksbehandling/dokumentmaler"],
  },
  {
    id: "4914f041-a899-4900-b228-8ca96122fb45",
    repoName: "era",
    prettyName: "Bilpleie",
    onlyPaths: ["apps/bilpleie-saksbehandling/dokumentmaler"],
  },
  {
    id: "cb3181b5-a126-4519-99cb-bb941ccd79b3",
    repoName: "arbeidstid-service",
    prettyName: "Arbeidstid",
    onlyPaths: ["dokumentmaler"],
  },
  {
    id: "a0c5d4c8-d5a3-46f2-9d59-54ecebddb62a",
    repoName: "yrkeskvalifikasjon-monorepo",
    prettyName: "Yrkeskvalifikasjon",
    onlyPaths: ["dokumentmaler"],
  },
  {
    id: "48e8d8a9-0bed-4f83-811e-f02ecca059ac",
    repoName: "asbest-melding",
    prettyName: "Asbest melding",
    onlyPaths: ["BrevTjeneste/Brevmaler"],
  },
  {
    id: "5a6eba39-5583-47b0-8c07-0f40b71c38c3",
    repoName: "asbest-saksbehandling",
    prettyName: "Asbest",
    onlyPaths: ["src/RegistrerSøknad/SendKvittering/Brevmaler"],
  },
].toSorted((a, b) => a.prettyName.localeCompare(b.prettyName));

export const allowedRepoNames = new Set(allowedRepos.map((r) => r.repoName));

export type AzDoRepoWithName = Readonly<[azDoRepo: AzureDevOpsRepo, prettyName: string]>;
