import type { ProviderId } from "@/utils/types";

export const PROVIDER_IDS = ["azdo", "github"] as const satisfies readonly ProviderId[];

/**
 * A repository in the normalised model shared across providers.
 */
export interface Repo {
  /**
   * Identifier used for subsequent API calls against the provider.
   * GitHub: the repository name. Azure DevOps: the repository id (GUID).
   */
  id: string;
  /** Display name of the repository. */
  name: string;
  /** Default branch name, normalised without any `refs/heads/` prefix. */
  defaultBranch: string;
}

/** A file entry within a repository. */
export interface RepoFile {
  path: string;
}

/** The content of a single file. */
export interface FileContent {
  filePath: string;
  content: string;
}

/**
 * The GitProvider port: a single interface for listing repos, listing branches,
 * listing files, and reading file content over the normalised model. All branch
 * names are normalised (no `refs/heads/` prefix).
 */
export interface GitProvider {
  listRepos(): Promise<Repo[]>;
  listBranches(repoId: string): Promise<string[]>;
  listFiles(repoId: string, branch: string): Promise<RepoFile[]>;
  readFileContent(repoId: string, branch: string, filePath: string): Promise<string>;
  readManyFileContents(repoId: string, branch: string, filePaths: string[]): Promise<FileContent[]>;
}

export type ProviderRegistry = Record<ProviderId, GitProvider>;

/** Aggregated repositories per provider, with any per-provider error captured. */
export type AllReposResult = Record<ProviderId, { repos: Repo[]; error: string | null }>;
