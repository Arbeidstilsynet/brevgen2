"use client";

import { AzureDevOpsRepo, fetchBranchesFromAzure, fetchReposFromAzure } from "@/actions/azdo";
import { useEffect, useState } from "react";
import { BranchSelector } from "./BranchSelector";
import { FileSelector } from "./FileSelector";
import { RepoSelector } from "./RepoSelector";

type Props = Readonly<{
  onFileSelected: (repoId: string, branch: string, filePath: string) => void;
}>;

export function Config({ onFileSelected }: Props) {
  const [repos, setRepos] = useState<AzureDevOpsRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<AzureDevOpsRepo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      const data = await fetchReposFromAzure();
      setRepos(data);
    };
    fetchRepos();
  }, []);

  const handleRepoSelect = async (repo: AzureDevOpsRepo) => {
    setSelectedRepo(repo);
    setSelectedBranch(null);
    const repoBranches = await fetchBranchesFromAzure(repo.id);
    setSelectedBranch(repo.defaultBranch.replace("refs/heads/", ""));
    setBranches(repoBranches.map((b) => b.replace("refs/heads/", "")));
  };

  return (
    <div className="flex flex-col p-4 space-y-4">
      <h2 className="text-xl font-semibold">Download a file from version control</h2>
      <span>Warning: this will replace the editor contents</span>

      <RepoSelector repos={repos} onRepoSelect={handleRepoSelect} />

      {selectedRepo && selectedBranch && (
        <>
          <BranchSelector
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchSelect={(b) => setSelectedBranch(b)}
          />

          <h2 className="text-xl font-semibold">Select a Markdown file</h2>
          <FileSelector
            repoId={selectedRepo.id}
            branch={selectedBranch}
            onFileSelect={onFileSelected}
          />
        </>
      )}
    </div>
  );
}
