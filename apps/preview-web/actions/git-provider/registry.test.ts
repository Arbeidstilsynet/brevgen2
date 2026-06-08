import { describe, expect, it } from "vitest";
import { createInMemoryGitProvider } from "./in-memory";
import { aggregateRepos, selectProvider } from "./registry";
import type { GitProvider, ProviderRegistry, Repo } from "./types";

function providerWithRepos(repos: Repo[]): GitProvider {
  return createInMemoryGitProvider({
    repos: repos.map((r) => ({ ...r, branches: [], files: {}, content: {} })),
  });
}

function failingProvider(message: string): GitProvider {
  return {
    listRepos: () => Promise.reject(new Error(message)),
    listBranches: () => Promise.reject(new Error(message)),
    listFiles: () => Promise.reject(new Error(message)),
    readFileContent: () => Promise.reject(new Error(message)),
    readManyFileContents: () => Promise.reject(new Error(message)),
  };
}

const githubRepo: Repo = { id: "brevgen2", name: "brevgen2", defaultBranch: "main" };
const azdoRepo: Repo = { id: "guid-1", name: "era", defaultBranch: "main" };

describe("aggregateRepos", () => {
  it("returns repos per provider when all succeed", async () => {
    const registry: ProviderRegistry = {
      github: providerWithRepos([githubRepo]),
      azdo: providerWithRepos([azdoRepo]),
    };

    const result = await aggregateRepos(registry);

    expect(result).toEqual({
      github: { repos: [githubRepo], error: null },
      azdo: { repos: [azdoRepo], error: null },
    });
  });

  it("captures one provider's failure without dropping the others", async () => {
    const registry: ProviderRegistry = {
      github: providerWithRepos([githubRepo]),
      azdo: failingProvider("AZURE_DEVOPS_PAT er ikke konfigurert"),
    };

    const result = await aggregateRepos(registry);

    expect(result.github).toEqual({ repos: [githubRepo], error: null });
    expect(result.azdo.repos).toEqual([]);
    expect(result.azdo.error).toContain("AZURE_DEVOPS_PAT er ikke konfigurert");
  });
});

describe("selectProvider", () => {
  it("returns the adapter registered for the given provider id", () => {
    const github = providerWithRepos([githubRepo]);
    const azdo = providerWithRepos([azdoRepo]);
    const registry: ProviderRegistry = { github, azdo };

    expect(selectProvider(registry, "github")).toBe(github);
    expect(selectProvider(registry, "azdo")).toBe(azdo);
  });
});
