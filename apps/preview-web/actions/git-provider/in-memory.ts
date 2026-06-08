import type { FileContent, GitProvider, Repo, RepoFile } from "./types";

export interface InMemoryRepoSeed extends Repo {
  branches: string[];
  /** Files keyed by branch name. */
  files: Record<string, RepoFile[]>;
  /** File content keyed by `${branch}:${path}`. */
  content: Record<string, string>;
}

export interface InMemorySeed {
  repos: InMemoryRepoSeed[];
}

/**
 * An in-memory GitProvider adapter for tests. It serves seeded repos, branches,
 * files, and file content without any network access.
 */
export function createInMemoryGitProvider(seed: InMemorySeed): GitProvider {
  function getRepo(repoId: string): InMemoryRepoSeed {
    const repo = seed.repos.find((r) => r.id === repoId);
    if (!repo) {
      throw new Error(`Unknown repo: ${repoId}`);
    }
    return repo;
  }

  return {
    listRepos() {
      return Promise.resolve(
        seed.repos.map(({ id, name, defaultBranch }) => ({
          id,
          name,
          defaultBranch,
        })),
      );
    },
    listBranches(repoId) {
      return Promise.resolve(getRepo(repoId).branches);
    },
    listFiles(repoId, branch) {
      return Promise.resolve(getRepo(repoId).files[branch] ?? []);
    },
    readFileContent(repoId, branch, filePath) {
      const content = getRepo(repoId).content[`${branch}:${filePath}`];
      if (content === undefined) {
        throw new Error(`Unknown file: ${repoId}@${branch}:${filePath}`);
      }
      return Promise.resolve(content);
    },
    async readManyFileContents(repoId, branch, filePaths) {
      const results: FileContent[] = [];
      for (const filePath of filePaths) {
        results.push({ filePath, content: await this.readFileContent(repoId, branch, filePath) });
      }
      return results;
    },
  };
}
