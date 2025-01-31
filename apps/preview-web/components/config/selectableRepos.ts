type RepoInfo = {
  /**
   * Name of the Git repository
   */
  repoName: string;
  /**
   * Pretty name of the selection
   */
  prettyName: string;
  /**
   * Restrict file options to these paths if not set to null
   */
  onlyPaths: string[] | null;
};

export const allowedRepos: RepoInfo[] = [
  {
    repoName: "felles-brevgenerator",
    prettyName: "Brevgenerator2 (eksempler)",
    onlyPaths: ["apps/preview-web/examples"],
  },
  {
    repoName: "bemanningsforetak-saksbehandling2",
    prettyName: "Bemanning",
    onlyPaths: ["dokumentmaler"],
  },
  {
    repoName: "era",
    prettyName: "Bilpleie",
    onlyPaths: ["apps/bilpleie-saksbehandling/dokumentmaler"],
  },
  {
    repoName: "arbeidstid-service",
    prettyName: "Arbeidstid",
    onlyPaths: ["dokumentmaler"],
  },
];

export const allowedRepoNames = new Set(allowedRepos.map((r) => r.repoName));
