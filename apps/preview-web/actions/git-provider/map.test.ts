import { describe, expect, it } from "vitest";
import { mapAzureRepo, mapGitHubRepo, stripRefsHeads } from "./map";

describe("stripRefsHeads", () => {
  it("strips a refs/heads/ prefix", () => {
    expect(stripRefsHeads("refs/heads/main")).toBe("main");
  });

  it("is idempotent for already-bare branch names", () => {
    expect(stripRefsHeads("main")).toBe("main");
    expect(stripRefsHeads(stripRefsHeads("refs/heads/feature/x"))).toBe("feature/x");
  });
});

describe("mapGitHubRepo", () => {
  it("uses the repo name as the id and normalises the default branch", () => {
    expect(
      mapGitHubRepo({
        name: "brevgen2",
        full_name: "Arbeidstilsynet/brevgen2",
        default_branch: "main",
      }),
    ).toEqual({ id: "brevgen2", name: "brevgen2", defaultBranch: "main" });
  });
});

describe("mapAzureRepo", () => {
  it("uses the repo GUID as the id and strips the refs/heads prefix", () => {
    expect(
      mapAzureRepo({
        id: "guid-1",
        name: "era",
        defaultBranch: "refs/heads/main",
        remoteUrl: "",
        sshUrl: "",
        webUrl: "",
        isDisabled: false,
        isInMaintenance: false,
      }),
    ).toEqual({ id: "guid-1", name: "era", defaultBranch: "main" });
  });
});
