import { describe, expect, it } from "vitest";
import { createInMemoryGitProvider, type InMemorySeed } from "./in-memory";

const seed: InMemorySeed = {
  repos: [
    {
      id: "repo-1",
      name: "era",
      defaultBranch: "main",
      branches: ["main", "feature"],
      files: {
        main: [{ path: "dokumentmaler/a.md" }, { path: "dokumentmaler/b.md" }],
      },
      content: {
        "main:dokumentmaler/a.md": "# A",
        "main:dokumentmaler/b.md": "# B",
      },
    },
  ],
};

describe("createInMemoryGitProvider", () => {
  it("lists seeded repos in the normalised model", async () => {
    const provider = createInMemoryGitProvider(seed);

    const repos = await provider.listRepos();

    expect(repos).toEqual([{ id: "repo-1", name: "era", defaultBranch: "main" }]);
  });

  it("lists branches for a repo", async () => {
    const provider = createInMemoryGitProvider(seed);

    expect(await provider.listBranches("repo-1")).toEqual(["main", "feature"]);
  });

  it("lists files for a branch", async () => {
    const provider = createInMemoryGitProvider(seed);

    expect(await provider.listFiles("repo-1", "main")).toEqual([
      { path: "dokumentmaler/a.md" },
      { path: "dokumentmaler/b.md" },
    ]);
  });

  it("reads file content", async () => {
    const provider = createInMemoryGitProvider(seed);

    expect(await provider.readFileContent("repo-1", "main", "dokumentmaler/a.md")).toBe("# A");
  });

  it("reads many file contents", async () => {
    const provider = createInMemoryGitProvider(seed);

    const contents = await provider.readManyFileContents("repo-1", "main", [
      "dokumentmaler/a.md",
      "dokumentmaler/b.md",
    ]);

    expect(contents).toEqual([
      { filePath: "dokumentmaler/a.md", content: "# A" },
      { filePath: "dokumentmaler/b.md", content: "# B" },
    ]);
  });
});
