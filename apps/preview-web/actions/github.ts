"use server";

import { requireSession } from "@/auth";
import { createAppAuth } from "@octokit/auth-app";

const organization = "Arbeidstilsynet";
const token = process.env.GITHUB_PAT;

const appAuth =
  process.env.GITHUB_APP_ID &&
  process.env.GITHUB_APP_INSTALLATION_ID &&
  process.env.GITHUB_APP_PRIVATE_KEY
    ? createAppAuth({
        appId: process.env.GITHUB_APP_ID,
        installationId: Number(process.env.GITHUB_APP_INSTALLATION_ID),
        privateKey: process.env.GITHUB_APP_PRIVATE_KEY.replaceAll(String.raw`\n`, "\n"),
      })
    : null;

export async function getGitHubToken(): Promise<string> {
  if (process.env.GITHUB_PAT) {
    return process.env.GITHUB_PAT;
  }

  if (!appAuth) {
    throw new Error("Missing GitHub auth configuration. Set GITHUB_PAT or GitHub App env vars.");
  }

  const auth = await appAuth({ type: "installation" });
  return auth.token;
}

async function githubFetch(
  /**
   * Full URL to GitHub API endpoint, e.g. https://api.github.com/orgs/{org}/repos
   */
  url: string,
  /**
   * https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api?apiVersion=2026-03-10#media-types
   */
  accept = "application/vnd.github+json",
) {
  await requireSession();
  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  default_branch: string;
  html_url: string;
  disabled: boolean;
  archived: boolean;
}

export async function fetchReposFromGitHub(): Promise<GitHubRepo[]> {
  const url = `https://api.github.com/orgs/${organization}/repos?per_page=100`;
  const response = await githubFetch(url);

  if (!response.ok) {
    console.error(await response.text());
    throw new Error(
      `Failed to fetch repositories from GitHub, status: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as GitHubRepo[];
  return data.filter((r) => !r.disabled);
}

interface GitHubBranch {
  name: string;
}

export async function fetchBranchesFromGitHub(repo: string): Promise<string[]> {
  const url = `https://api.github.com/repos/${organization}/${repo}/branches?per_page=100`;
  const response = await githubFetch(url);

  if (!response.ok) {
    console.error(await response.text());
    throw new Error(
      `Failed to fetch branches from GitHub for ${repo}, status: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as GitHubBranch[];
  return data.map((branch) => branch.name);
}

export interface GitHubFile {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubFile[];
  truncated: boolean;
}

export async function fetchFilesFromGitHub(repo: string, branch: string): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${organization}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const response = await githubFetch(url);

  if (!response.ok) {
    console.error(await response.text());
    throw new Error(
      `Failed to fetch files from GitHub for ${repo}/${branch}, status: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as GitHubTreeResponse;
  return data.tree.filter((item) => item.type === "blob");
}

export async function fetchFileContentFromGitHub(
  repo: string,
  branch: string,
  filePath: string,
): Promise<string> {
  await requireSession();
  const url = `https://api.github.com/repos/${organization}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`;
  const response = await githubFetch(url, "application/vnd.github.raw+json");

  if (!response.ok) {
    console.error(await response.text());
    throw new Error(
      `Failed to fetch file content from GitHub for ${repo}/${filePath}, status: ${response.status} ${response.statusText}`,
    );
  }

  return await response.text();
}

export async function fetchManyFileContentFromGitHub(
  repo: string,
  branch: string,
  filePaths: string[],
) {
  return await Promise.all(
    filePaths.map(async (filePath) => ({
      filePath,
      content: await fetchFileContentFromGitHub(repo, branch, filePath),
    })),
  );
}
