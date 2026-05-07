"use server";

import { type AzureDevOpsRepo, fetchReposFromAzure } from "./azdo";
import { type GitHubRepo, fetchReposFromGitHub } from "./github";

export interface AllReposResult {
  azdoRepos: AzureDevOpsRepo[];
  azdoError: string | null;
  githubRepos: GitHubRepo[];
  githubError: string | null;
}

export async function fetchAllRepos(): Promise<AllReposResult> {
  const [azdo, github] = await Promise.allSettled([fetchReposFromAzure(), fetchReposFromGitHub()]);

  return {
    azdoRepos: azdo.status === "fulfilled" ? azdo.value : [],
    azdoError: azdo.status === "rejected" ? String(azdo.reason) : null,
    githubRepos: github.status === "fulfilled" ? github.value : [],
    githubError: github.status === "rejected" ? String(github.reason) : null,
  };
}
