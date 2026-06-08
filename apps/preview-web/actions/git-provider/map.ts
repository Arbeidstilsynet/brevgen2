import type { AzureDevOpsRepo } from "@/actions/azdo";
import type { GitHubRepo } from "@/actions/github";
import type { Repo } from "./types";

/** Remove a leading `refs/heads/` prefix from a branch name. Idempotent. */
export function stripRefsHeads(branch: string): string {
  return branch.replace(/^refs\/heads\//, "");
}

/** Map a GitHub repository onto the normalised model. The id is the repo name. */
export function mapGitHubRepo(repo: GitHubRepo): Repo {
  return {
    id: repo.name,
    name: repo.name,
    defaultBranch: stripRefsHeads(repo.default_branch),
  };
}

/** Map an Azure DevOps repository onto the normalised model. The id is the repo GUID. */
export function mapAzureRepo(repo: AzureDevOpsRepo): Repo {
  return {
    id: repo.id,
    name: repo.name,
    defaultBranch: stripRefsHeads(repo.defaultBranch),
  };
}
