"use client";

import { AzureDevOpsRepo, fetchBranchesFromAzure, fetchReposFromAzure } from "@/actions/azdo";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActionButton, TabButton } from "../buttons";
import { useToast } from "../toast/provider";
import { Toast } from "../toast/Toast";
import { BranchSelector } from "./BranchSelector";
import { FileSelector } from "./FileSelector";
import { RepoSelector } from "./RepoSelector";
import { VariablesReport } from "./VariablesReport";

type Props = Readonly<{
  onFileSelected: (repoId: string, branch: string, filePath: string) => void | Promise<void>;
  onExampleSelected: (example: "initial" | "advanced") => void;
}>;

export function Config({ onFileSelected, onExampleSelected }: Props) {
  const { message, variant, clearToast } = useToast();

  const [selectedRepo, setSelectedRepo] = useState<AzureDevOpsRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"fileSelect" | "loadExamples" | "variablesReport">(
    "fileSelect",
  );

  const { data: repos } = useQuery<AzureDevOpsRepo[]>({
    queryKey: ["repos"],
    queryFn: fetchReposFromAzure,
    initialData: [],
  });

  const { data: branches = [] } = useQuery<string[]>({
    queryKey: ["branches", selectedRepo?.id],
    queryFn: async () => {
      const data = await fetchBranchesFromAzure(selectedRepo!.id);
      if (!selectedBranch) {
        setSelectedBranch(selectedRepo!.defaultBranch.replace("refs/heads/", ""));
      }
      return data;
    },
    enabled: Boolean(selectedRepo),
    select: (data) => data.map((b) => b.replace("refs/heads/", "")),
  });

  const handleRepoSelect = (repo: AzureDevOpsRepo) => {
    setSelectedRepo(repo);
    setSelectedBranch(null);
  };

  return (
    <article className="flex flex-col p-4 space-y-4">
      <h1 className="text-2xl font-bold">Konfigurasjon</h1>

      {message && <Toast message={message} variant={variant} onClose={clearToast} />}

      <div>
        <TabButton isActive={activeTab === "fileSelect"} onClick={() => setActiveTab("fileSelect")}>
          Versjonskontroll
        </TabButton>
        <TabButton
          isActive={activeTab === "loadExamples"}
          onClick={() => setActiveTab("loadExamples")}
        >
          Eksempler
        </TabButton>
        <TabButton
          isActive={activeTab === "variablesReport"}
          onClick={() => setActiveTab("variablesReport")}
        >
          Flettefelt
        </TabButton>
      </div>

      {(activeTab === "fileSelect" || activeTab === "loadExamples") && (
        <>
          <h2 className="text-xl font-semibold">
            Last inn dokument fra {activeTab === "fileSelect" ? "versjonskontroll" : "eksempler"}
          </h2>
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-gray-900 p-4 mb-4"
            role="alert"
          >
            <p className="font-bold">Advarsel</p>
            <p>Dette vil erstatte innholdet i editoren</p>
          </div>
        </>
      )}

      {activeTab === "fileSelect" && (
        <>
          <RepoSelector repos={repos} selected={selectedRepo} onRepoSelect={handleRepoSelect} />

          {selectedRepo && selectedBranch && (
            <>
              <BranchSelector
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchSelect={(b) => setSelectedBranch(b)}
              />

              <h3 className="text-l font-semibold">Velg en Markdown-fil</h3>
              <FileSelector
                repo={selectedRepo}
                branch={selectedBranch}
                onFileSelect={onFileSelected}
              />
            </>
          )}
        </>
      )}

      {activeTab === "loadExamples" && (
        <div className="flex flex-col space-y-4">
          <h3 className="text-l font-semibold">Velg et eksempel</h3>
          <div className="flex gap-4">
            <ActionButton onClick={() => onExampleSelected("initial")}>Vanlig</ActionButton>
            <ActionButton onClick={() => onExampleSelected("advanced")}>Avansert</ActionButton>
          </div>
        </div>
      )}

      {activeTab === "variablesReport" && (
        <>
          <h2 className="text-xl font-semibold">Oversikt per repo</h2>
          <span>Dette viser alle variabler som er referert i fagsystemets brevmaler</span>

          <RepoSelector repos={repos} selected={selectedRepo} onRepoSelect={handleRepoSelect} />

          {selectedRepo && selectedBranch && (
            <>
              <BranchSelector
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchSelect={(b) => setSelectedBranch(b)}
              />

              <VariablesReport repo={selectedRepo} branch={selectedBranch} />
            </>
          )}
        </>
      )}
    </article>
  );
}
