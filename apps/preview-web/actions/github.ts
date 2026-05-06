"use server";

import { requireSession } from "@/auth";

const organization = "Arbeidstilsynet";
const token = process.env.GITHUB_PAT;

async function githubFetch(url: string) {
  await requireSession();
  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
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

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.raw+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

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
