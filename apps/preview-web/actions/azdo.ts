"use server";

import { requireSession } from "@/auth";

const organization = "Atil-utvikling";
const project = "Produkter og tjenester";
const token = process.env.AZURE_DEVOPS_PAT;

async function azdoFetch(url: string, { expectJson = true }: { expectJson?: boolean } = {}) {
  await requireSession();
  if (!token) {
    throw new Error("AZURE_DEVOPS_PAT er ikke konfigurert");
  }
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(":" + token).toString("base64")}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Azure DevOps: ${response.status} ${response.statusText}`);
  }

  if (expectJson) {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error("Azure DevOps returnerte uventet svar — sjekk at PAT er gyldig");
    }
  }

  return response;
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

  const data = (await response.json()) as AzureDevOpsReposResponse;
  if (!data.count) {
    throw new Error(
      `Response ok, but no repos found. Check if PAT user has sufficient license to read repos. Organization:${organization} project:${project}.`,
    );
  }
  return data.value.filter((r) => !r.isDisabled);
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
  const data = (await response.json()) as AzureDevOpsBranchesResponse;
  return data.value.map((branch) => branch.name);
}

interface AzureDevOpsFile {
  path: string;
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

  const response = await azdoFetch(url, { expectJson: false });

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
