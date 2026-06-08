import {
  fetchBranchesFromAzure,
  fetchFileContentFromAzure,
  fetchFilesFromAzure,
  fetchManyFileContentFromAzure,
  fetchReposFromAzure,
} from "@/actions/azdo";
import {
  fetchBranchesFromGitHub,
  fetchFileContentFromGitHub,
  fetchFilesFromGitHub,
  fetchManyFileContentFromGitHub,
  fetchReposFromGitHub,
} from "@/actions/github";
import { mapAzureRepo, mapGitHubRepo, stripRefsHeads } from "./map";
import type { GitProvider, ProviderRegistry } from "./types";

/**
 * GitHub adapter for the GitProvider port. Repo ids are repository names, which
 * is what the underlying GitHub API calls expect.
 */
export const gitHubProvider: GitProvider = {
  async listRepos() {
    const repos = await fetchReposFromGitHub();
    return repos.map(mapGitHubRepo);
  },
  async listBranches(repoId) {
    const branches = await fetchBranchesFromGitHub(repoId);
    return branches.map(stripRefsHeads);
  },
  listFiles(repoId, branch) {
    return fetchFilesFromGitHub(repoId, stripRefsHeads(branch));
  },
  readFileContent(repoId, branch, filePath) {
    return fetchFileContentFromGitHub(repoId, stripRefsHeads(branch), filePath);
  },
  readManyFileContents(repoId, branch, filePaths) {
    return fetchManyFileContentFromGitHub(repoId, stripRefsHeads(branch), filePaths);
  },
};

/**
 * Azure DevOps adapter for the GitProvider port. Repo ids are repository GUIDs.
 * Branch names are normalised without the `refs/heads/` prefix the API returns,
 * and inbound branch arguments are normalised defensively for legacy callers.
 */
export const azureDevOpsProvider: GitProvider = {
  async listRepos() {
    const repos = await fetchReposFromAzure();
    return repos.map(mapAzureRepo);
  },
  async listBranches(repoId) {
    const branches = await fetchBranchesFromAzure(repoId);
    return branches.map(stripRefsHeads);
  },
  listFiles(repoId, branch) {
    return fetchFilesFromAzure(repoId, stripRefsHeads(branch));
  },
  readFileContent(repoId, branch, filePath) {
    return fetchFileContentFromAzure(repoId, stripRefsHeads(branch), filePath);
  },
  readManyFileContents(repoId, branch, filePaths) {
    return fetchManyFileContentFromAzure(repoId, stripRefsHeads(branch), filePaths);
  },
};

/** The production registry mapping provider ids to their real adapters. */
export const realRegistry: ProviderRegistry = {
  github: gitHubProvider,
  azdo: azureDevOpsProvider,
};
