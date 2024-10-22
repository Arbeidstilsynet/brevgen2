type RepoName = string;
type SelectableRepo = {
  /**
   * Pretty name of the repo
   */
  prettyName: string;
  /**
   * Restrict file options to these paths if not set to null
   */
  onlyPaths: string[] | null;
};

export const selectableRepos = {
  "felles-brevgenerator": {
    prettyName: "Brevgenerator2 (eksempler)",
    onlyPaths: ["apps/preview-web/examples"],
  },
  "bemanningsforetak-saksbehandling2": {
    prettyName: "Bemanning",
    onlyPaths: ["dokumentmaler"],
  },
  "bilpleie-saksbehandling": {
    prettyName: "Bilpleie",
    onlyPaths: ["dokumentmaler"],
  },
  "asbest-saksbehandling": {
    prettyName: "Asbest søknad",
    onlyPaths: ["dokumentmaler"],
  },
  "asbest-melding": {
    prettyName: "Asbest melding",
    onlyPaths: ["dokumentmaler"],
  },
} as const satisfies Record<RepoName, SelectableRepo>;
