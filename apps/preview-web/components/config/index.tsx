"use client";

import { AzureDevOpsRepo, fetchBranchesFromAzure, fetchReposFromAzure } from "@/actions/azdo";
import { fetchBranchesFromGitHub, fetchReposFromGitHub, GitHubRepo } from "@/actions/github";
import type { GitProvider } from "@/utils/types";
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
import type { RepoWithName } from "./selectableRepos";
import { Settings } from "./Settings";
import { VariablesReport } from "./VariablesReport";

type Props = Readonly<{
  onFileSelected: (
    provider: GitProvider,
    repoIdentifier: string,
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

  const [selectedRepo, setSelectedRepo] = useState<RepoWithName | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "fileSelect" | "loadExamples" | "variablesReport" | "settings"
  >("fileSelect");

  const { data: azdoRepos, error: azdoReposError } = useQuery<AzureDevOpsRepo[]>({
    queryKey: ["repos", "azdo"],
    queryFn: fetchReposFromAzure,
    initialData: [],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: githubRepos, error: githubReposError } = useQuery<GitHubRepo[]>({
    queryKey: ["repos", "github"],
    queryFn: fetchReposFromGitHub,
    initialData: [],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: branches = [], error: branchesError } = useQuery<string[]>({
    queryKey: ["branches", selectedRepo?.provider, selectedRepo?.repo.name],
    queryFn: async () => {
      if (!selectedRepo) throw new Error("No repo selected");
      if (selectedRepo.provider === "azdo") {
        const data = await fetchBranchesFromAzure(selectedRepo.repoInfo.id);
        if (!selectedBranch) {
          setSelectedBranch(selectedRepo.repo.defaultBranch.replace("refs/heads/", ""));
        }
        return data.map((b) => b.replace("refs/heads/", ""));
      }
      const data = await fetchBranchesFromGitHub(selectedRepo.repo.name);
      if (!selectedBranch) {
        setSelectedBranch(selectedRepo.repo.default_branch);
      }
      return data;
    },
    enabled: isAuthenticated && Boolean(selectedRepo),
  });

  const handleRepoSelected = (repo: RepoWithName) => {
    if (selectedRepo?.prettyName !== repo.prettyName) {
      setSelectedBranch(null);
    }
    setSelectedRepo(repo);
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
            Last ned brevmal fra {activeTab === "fileSelect" ? "versjonskontroll" : "eksempler"}
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
            azdoRepos={azdoRepos}
            githubRepos={githubRepos}
            selectedRepoPrettyName={selectedRepo?.prettyName ?? null}
            onRepoSelected={handleRepoSelected}
            disabled={!isAuthenticated}
            azdoError={Boolean(azdoReposError)}
            githubError={Boolean(githubReposError)}
          />
          <ErrorDetails error={branchesError} label="Kunne ikke hente branches" />

          {selectedRepo && selectedBranch && (
            <>
              <BranchSelector
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchSelect={(b) => setSelectedBranch(b)}
              />

              <h3 className="text-l font-semibold">Velg brevmal</h3>
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
            azdoRepos={azdoRepos}
            githubRepos={githubRepos}
            selectedRepoPrettyName={selectedRepo?.prettyName ?? null}
            onRepoSelected={handleRepoSelected}
            disabled={!isAuthenticated}
            azdoError={Boolean(azdoReposError)}
            githubError={Boolean(githubReposError)}
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
