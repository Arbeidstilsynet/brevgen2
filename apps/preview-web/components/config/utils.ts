import { allowedRepoNames, allowedRepos } from "./selectableRepos";

const isRepoChooseable = (repoName: string) => allowedRepoNames.has(repoName);

const isMarkdownFile = (path: string): boolean => path.endsWith(".md") || path.endsWith(".mdat");

function isPathAllowed(repoName: string, path: string): boolean {
  const repoInfo = allowedRepos.find((r) => r.repoName === repoName);
  if (!repoInfo) {
    return false;
  }
  if (!repoInfo.onlyPaths) {
    return true;
  }
  return repoInfo.onlyPaths.some((p) => path.includes(p));
}

export function isAzDoFileAllowed(repoName: string, path: string): boolean {
  return isRepoChooseable(repoName) && isMarkdownFile(path) && isPathAllowed(repoName, path);
}
