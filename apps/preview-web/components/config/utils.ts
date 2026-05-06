import { GIT_PARAMS } from "../editor/useLoadPermanentUrl";
import type { RepoInfo } from "./allowedRepos";
import { allowedRepoNames, allowedRepos } from "./allowedRepos";

const isRepoChooseable = (repoName: string) => allowedRepoNames.has(repoName);

const isMarkdownFile = (path: string): boolean => path.endsWith(".md") || path.endsWith(".mdat");

function isPathAllowed(prettyName: string, path: string): boolean {
  const repoInfo = allowedRepos.find((r) => r.prettyName === prettyName);
  if (!repoInfo) {
    return false;
  }

  return repoInfo.onlyPaths.some((p) => path.includes(p));
}

export function isFileAllowed({
  repoName,
  prettyName,
  path,
}: {
  repoName: string;
  prettyName: string;
  path: string;
}): boolean {
  return isRepoChooseable(repoName) && isMarkdownFile(path) && isPathAllowed(prettyName, path);
}

/** @deprecated Use isFileAllowed instead */
export const isAzDoFileAllowed = isFileAllowed;

function generatePermanentUrl(
  provider: RepoInfo["provider"],
  repoIdentifier: string,
  branch: string,
  key: string,
) {
  const baseUrl = globalThis.location.origin;
  const url = new URL(baseUrl);
  url.searchParams.set(GIT_PARAMS.provider, provider === "github" ? "gh" : "azdo");
  url.searchParams.set(GIT_PARAMS.git, encodeURIComponent(repoIdentifier));
  url.searchParams.set(GIT_PARAMS.branch, encodeURIComponent(branch));
  url.searchParams.set(GIT_PARAMS.file, encodeURIComponent(key));
  return url.toString();
}

export async function handleCopyUrl(
  provider: RepoInfo["provider"],
  repoIdentifier: string,
  branch: string,
  key: string,
) {
  const url = generatePermanentUrl(provider, repoIdentifier, branch, key);
  await navigator.clipboard.writeText(url);
}

/** @deprecated Use handleCopyUrl instead */
export async function handleCopyUrlGit(repoId: string, branch: string, key: string) {
  await handleCopyUrl("azdo", repoId, branch, key);
}
