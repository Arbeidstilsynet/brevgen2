"use server";

import type { ProviderId } from "@/utils/types";
import { realRegistry } from "./git-provider/adapters";
import { selectProvider } from "./git-provider/registry";
import type { FileContent, RepoFile } from "./git-provider/types";

/**
 * Server-action facade over the GitProvider port. Client components call these
 * functions with a provider id; the right adapter is selected on the server.
 */

export async function listBranches(providerId: ProviderId, repoId: string): Promise<string[]> {
  return selectProvider(realRegistry, providerId).listBranches(repoId);
}

export async function listFiles(
  providerId: ProviderId,
  repoId: string,
  branch: string,
): Promise<RepoFile[]> {
  return selectProvider(realRegistry, providerId).listFiles(repoId, branch);
}

export async function readFileContent(
  providerId: ProviderId,
  repoId: string,
  branch: string,
  filePath: string,
): Promise<string> {
  return selectProvider(realRegistry, providerId).readFileContent(repoId, branch, filePath);
}

export async function readManyFileContents(
  providerId: ProviderId,
  repoId: string,
  branch: string,
  filePaths: string[],
): Promise<FileContent[]> {
  return selectProvider(realRegistry, providerId).readManyFileContents(repoId, branch, filePaths);
}
