"use server";

import { requireSession } from "@/auth";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

const organization = "Arbeidstilsynet";

const appAuth =
  process.env.GITHUB_APP_ID &&
  process.env.GITHUB_APP_INSTALLATION_ID &&
  process.env.GITHUB_APP_PRIVATE_KEY
    ? createAppAuth({
        appId: process.env.GITHUB_APP_ID,
        installationId: process.env.GITHUB_APP_INSTALLATION_ID,
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

async function getOctokit(): Promise<Octokit> {
  await requireSession();
  const token = await getGitHubToken();
  return new Octokit({ auth: token });
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  default_branch: string;
}

export async function fetchReposFromGitHub(): Promise<GitHubRepo[]> {
  const octokit = await getOctokit();
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org: organization,
    per_page: 100,
  });
  return repos
    .filter((r) => !r.disabled)
    .map((r) => ({
      name: r.name,
      full_name: r.full_name,
      default_branch: r.default_branch ?? "main",
    }));
}

export async function fetchBranchesFromGitHub(repo: string): Promise<string[]> {
  const octokit = await getOctokit();
  const branches = await octokit.paginate(octokit.repos.listBranches, {
    owner: organization,
    repo,
    per_page: 100,
  });
  return branches.map((branch) => branch.name);
}

interface GitHubFile {
  path: string;
}

export async function fetchFilesFromGitHub(repo: string, branch: string): Promise<GitHubFile[]> {
  const octokit = await getOctokit();
  const { data } = await octokit.git.getTree({
    owner: organization,
    repo,
    tree_sha: branch,
    recursive: "1",
  });
  return data.tree
    .filter((item) => item.type === "blob")
    .map((item) => ({
      path: item.path,
    }));
}

export async function fetchFileContentFromGitHub(
  repo: string,
  branch: string,
  filePath: string,
): Promise<string> {
  const octokit = await getOctokit();
  const { data } = await octokit.repos.getContent({
    owner: organization,
    repo,
    path: filePath,
    ref: branch,
    mediaType: { format: "raw" },
  });
  // When format is "raw", Octokit returns a plain string but the types don't reflect this
  return data as unknown as string;
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
