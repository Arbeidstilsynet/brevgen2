import { GIT_PARAMS } from "../editor/useLoadPermanentUrl";
import { allowedRepoNames, allowedRepos } from "./selectableRepos";

const isRepoChooseable = (repoName: string) => allowedRepoNames.has(repoName);

const isMarkdownFile = (path: string): boolean => path.endsWith(".md") || path.endsWith(".mdat");

function isPathAllowed(prettyName: string, path: string): boolean {
  const repoInfo = allowedRepos.find((r) => r.prettyName === prettyName);
  if (!repoInfo) {
    return false;
  }

  return repoInfo.onlyPaths.some((p) => path.includes(p));
}

export function isAzDoFileAllowed({
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

function generatePermanentUrlGit(repoId: string, branch: string, key: string) {
  const baseUrl = globalThis.location.origin;
  const url = new URL(baseUrl);
  url.searchParams.set(GIT_PARAMS.git, encodeURIComponent(repoId));
  url.searchParams.set(GIT_PARAMS.branch, encodeURIComponent(branch));
  url.searchParams.set(GIT_PARAMS.file, encodeURIComponent(key));
  return url.toString();
}

export async function handleCopyUrlGit(repoId: string, branch: string, key: string) {
  const url = generatePermanentUrlGit(repoId, branch, key);
  await navigator.clipboard.writeText(url);
}
