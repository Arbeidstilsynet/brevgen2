"use client";

import { AzureDevOpsRepo, fetchBranchesFromAzure, fetchReposFromAzure } from "@/actions/azdo";
import { useEffect, useState } from "react";
import { BranchSelector } from "./BranchSelector";
import { FileSelector } from "./FileSelector";
import { RepoSelector } from "./RepoSelector";

type Props = Readonly<{
  onFileSelected: (repoId: string, branch: string, filePath: string) => void;
  onExampleSelected: (example: "initial" | "advanced") => void;
}>;

export function Config({ onFileSelected, onExampleSelected }: Props) {
  const [repos, setRepos] = useState<AzureDevOpsRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<AzureDevOpsRepo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"fileSelect" | "loadExamples">("fileSelect");

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
    <article className="flex flex-col p-4 space-y-4">
      <h1 className="text-3xl font-bold">Konfigurasjon</h1>
      <h2 className="text-xl font-semibold">Last inn dokument</h2>
      <span>Advarsel: dette vil erstatte innholdet i editoren</span>

      <div className="flex space-x-4 mb-4">
        <button
          className={`py-2 px-4 ${activeTab === "fileSelect" ? "bg-blue-500 text-white shadow-lg" : "bg-gray-200 hover:bg-gray-300"}`}
          onClick={() => setActiveTab("fileSelect")}
        >
          Versjonskontroll (Git)
        </button>
        <button
          className={`py-2 px-4 ${activeTab === "loadExamples" ? "bg-blue-500 text-white shadow-lg" : "bg-gray-200 hover:bg-gray-300"}`}
          onClick={() => setActiveTab("loadExamples")}
        >
          Eksempler
        </button>
      </div>

      {activeTab === "fileSelect" && (
        <>
          <RepoSelector repos={repos} onRepoSelect={handleRepoSelect} />

          {selectedRepo && selectedBranch && (
            <>
              <BranchSelector
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchSelect={(b) => setSelectedBranch(b)}
              />

              <h2 className="text-xl font-semibold">Velg en Markdown-fil</h2>
              <FileSelector
                repoId={selectedRepo.id}
                repoName={selectedRepo.name}
                branch={selectedBranch}
                onFileSelect={onFileSelected}
              />
            </>
          )}
        </>
      )}

      {activeTab === "loadExamples" && (
        <div className="flex flex-col space-y-4">
          <p>Velg et eksempel</p>
          <div className="flex space-x-4">
            <button
              className="py-2 px-4 text-white bg-green-500 hover:bg-green-700 hover:shadow-lg transition duration-200"
              onClick={() => onExampleSelected("initial")}
            >
              Vanlig
            </button>
            <button
              className="py-2 px-4 text-white bg-green-500 hover:bg-green-700 hover:shadow-lg transition duration-200"
              onClick={() => onExampleSelected("advanced")}
            >
              Avansert
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
