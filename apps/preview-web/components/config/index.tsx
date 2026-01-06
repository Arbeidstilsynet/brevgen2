"use client";

import { AzureDevOpsRepo, fetchBranchesFromAzure, fetchReposFromAzure } from "@/actions/azdo";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { ActionButton, TabButton } from "../buttons";
import { ErrorDetails } from "../ErrorDetails";
import { useToast } from "../toast/provider";
import { Toast } from "../toast/Toast";
import { BranchSelector } from "./BranchSelector";
import { FileSelector } from "./FileSelector";
import { RepoSelector } from "./RepoSelector";
import { AzDoRepoWithName } from "./selectableRepos";
import { Settings } from "./Settings";
import { VariablesReport } from "./VariablesReport";

type Props = Readonly<{
  onFileSelected: (
    repoId: string,
    branch: string,
    filePath: string,
    systemName: string,
  ) => void | Promise<void>;
  onExampleSelected: (example: "initial" | "advanced") => void;
}>;

export function Config({ onFileSelected, onExampleSelected }: Props) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { message, variant, clearToast } = useToast();

  const [selectedRepo, setSelectedRepo] = useState<AzDoRepoWithName | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "fileSelect" | "loadExamples" | "variablesReport" | "settings"
  >("fileSelect");

  const { data: repos, error: reposError } = useQuery<AzureDevOpsRepo[]>({
    queryKey: ["repos"],
    queryFn: fetchReposFromAzure,
    initialData: [],
    enabled: isAuthenticated,
  });

  const { data: branches = [], error: branchesError } = useQuery<string[]>({
    queryKey: ["branches", selectedRepo?.[0].id],
    queryFn: async () => {
      const data = await fetchBranchesFromAzure(selectedRepo![0].id);
      if (!selectedBranch) {
        setSelectedBranch(selectedRepo![0].defaultBranch.replace("refs/heads/", ""));
      }
      return data;
    },
    enabled: isAuthenticated && Boolean(selectedRepo),
    select: (data) => data.map((b) => b.replace("refs/heads/", "")),
  });

  const handleRepoSelected = (repo: AzDoRepoWithName) => {
    setSelectedRepo(repo);
    if (selectedRepo?.[0].id !== repo[0].id) {
      setSelectedBranch(null);
    }
  };

  return (
    <article className="flex flex-col p-4 space-y-4">
      <h1 className="text-2xl font-bold">Kontrollpanel</h1>

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
        <TabButton isActive={activeTab === "settings"} onClick={() => setActiveTab("settings")}>
          Innstillinger
        </TabButton>
      </div>

      {!isAuthenticated && (activeTab === "fileSelect" || activeTab === "variablesReport") && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900 flex gap-3 items-start">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-amber-800 text-xs font-bold"
          >
            !
          </span>
          <div>
            <p className="font-semibold">Innlogging kreves</p>
            <p className="text-sm">Du må være innlogget for å få tilgang til denne fanen.</p>
          </div>
        </div>
      )}

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
          <RepoSelector
            repos={repos}
            selectedRepoName={selectedRepo?.[1] ?? null}
            onRepoSelected={handleRepoSelected}
            disabled={!isAuthenticated}
          />
          <ErrorDetails error={reposError} label="Kunne ikke hente repos" />
          <ErrorDetails error={branchesError} label="Kunne ikke hente branches" />

          {selectedRepo && selectedBranch && (
            <>
              <BranchSelector
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchSelect={(b) => setSelectedBranch(b)}
              />

              <h3 className="text-l font-semibold">Velg en Markdown-fil</h3>
              <FileSelector
                repoWithName={selectedRepo}
                branch={selectedBranch}
                onFileSelected={onFileSelected}
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

          <RepoSelector
            repos={repos}
            selectedRepoName={selectedRepo?.[1] ?? null}
            onRepoSelected={handleRepoSelected}
            disabled={!isAuthenticated}
          />

          {selectedRepo && selectedBranch && (
            <>
              <BranchSelector
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchSelect={(b) => setSelectedBranch(b)}
              />

              <VariablesReport repoWithName={selectedRepo} branch={selectedBranch} />
            </>
          )}
        </>
      )}

      {activeTab === "settings" && <Settings />}
    </article>
  );
}
