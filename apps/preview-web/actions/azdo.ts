"use server";

import { requireSession } from "@/auth";

const organization = "Atil-utvikling";
const project = "Produkter og tjenester";
const token = process.env.AZURE_DEVOPS_PAT;

async function azdoFetch(url: string) {
  await requireSession();
  return await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(":" + token).toString("base64")}`,
    },
    cache: "no-store",
  });
}

export interface AzureDevOpsRepo {
  id: string;
  name: string;
  defaultBranch: string;
  remoteUrl: string;
  sshUrl: string;
  webUrl: string;
  isDisabled: boolean;
  isInMaintenance: boolean;
}

interface AzureDevOpsReposResponse {
  value: AzureDevOpsRepo[];
  count: number;
}

export async function fetchReposFromAzure(): Promise<AzureDevOpsRepo[]> {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories?api-version=7.1`;
  const response = await azdoFetch(url);

  if (!response.ok) {
    console.error(await response.text());
    throw new Error(
      `Failed to fetch repositories from ${url}, status: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as AzureDevOpsReposResponse;
  if (!data.count) {
    throw new Error(
      `Response ok, but no repos found. Check if PAT user has sufficient license to read repos. Organization:${organization} project:${project}.`,
    );
  }
  return data.value.filter((r) => !r.isDisabled);
}

export interface AzureDevOpsFile {
  path: string;
  isFolder: boolean;
  size: number;
}

interface AzureDevOpsBranch {
  name: string;
}

interface AzureDevOpsBranchesResponse {
  value: AzureDevOpsBranch[];
}

export async function fetchBranchesFromAzure(repoId: string): Promise<string[]> {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repoId}/refs?filter=heads/&api-version=7.1`;
  const response = await azdoFetch(url);

  if (!response.ok) {
    console.error(await response.text());
    throw new Error(
      `Failed to fetch branches from ${url}, status: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as AzureDevOpsBranchesResponse;
  return data.value.map((branch) => branch.name);
}

interface AzureDevOpsFilesResponse {
  value: AzureDevOpsFile[];
}

export async function fetchFilesFromAzure(
  repoId: string,
  branch: string,
): Promise<AzureDevOpsFile[]> {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repoId}/items?recursionLevel=Full&versionDescriptor.version=${encodeURIComponent(
    branch,
  )}&api-version=7.1`;

  const response = await azdoFetch(url);

  if (!response.ok) {
    console.error(await response.text());
    throw new Error(
      `Failed to fetch files from ${url}, status: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as AzureDevOpsFilesResponse;
  return data.value;
}

export async function fetchFileContentFromAzure(
  repoId: string,
  branch: string,
  filePath: string,
): Promise<string> {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repoId}/items?path=${encodeURIComponent(
    filePath,
  )}&versionDescriptor.version=${encodeURIComponent(branch)}&api-version=7.1`;

  const response = await azdoFetch(url);

  if (!response.ok) {
    console.error(await response.text());
    throw new Error(
      `Failed to fetch file contents from ${url}, status: ${response.status} ${response.statusText}`,
    );
  }

  return await response.text();
}

export async function fetchManyFileContentFromAzure(
  repoId: string,
  branch: string,
  filePaths: string[],
) {
  return await Promise.all(
    filePaths.map(async (filePath) => ({
      filePath,
      content: await fetchFileContentFromAzure(repoId, branch, filePath),
    })),
  );
}
