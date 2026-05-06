// oxlint-disable no-shadow

"use client";

import { fetchFileContentFromAzure } from "@/actions/azdo";
import type { BucketFile } from "@/actions/gcp-bucket";
import { fetchFileContentFromGitHub } from "@/actions/github";
import type { GitProvider } from "@/utils/types";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent } from "react";
import { allowedRepos } from "../config/allowedRepos";
import { useToast } from "../toast/provider";
import { useLoadFile, useQueryWorkspaceFiles } from "../workspace/hooks";
import { extractTags, URL_SEARCH_PARAM_WORKSPACE } from "../workspace/utils";
import { getLoadedRepoFileName, getLoadedWorkspaceName, LastLoadedFile } from "./utils";

export const GIT_PARAMS = {
  git: "git",
  branch: "branch",
  file: "file",
  provider: "provider",
} as const;

function resolveProvider(providerParam: string | null): GitProvider {
  if (providerParam === "gh") return "github";
  // Default to azdo for backward compatibility (existing URLs without provider param)
  return "azdo";
}

/**
 * Load a file from the workspace or Git based on seach params
 */
export function useLoadPermanentUrl(
  isEditorReady: boolean,
  onLoad: (md: string) => void,
  setLastLoadedFile: (file: LastLoadedFile) => void,
) {
  const params = useSearchParams();
  const { addToast } = useToast();

  const provider = resolveProvider(params.get(GIT_PARAMS.provider));
  const gitParam = decodeURIComponent(params.get(GIT_PARAMS.git) ?? "") || null;
  const branchParam = decodeURIComponent(params.get(GIT_PARAMS.branch) ?? "");
  const fileParam = decodeURIComponent(params.get(GIT_PARAMS.file) ?? "");

  // If git parameters are provided, they take precedence.
  const workspaceParamRaw = gitParam ? null : params.get(URL_SEARCH_PARAM_WORKSPACE);
  const workspaceParam = decodeURIComponent(workspaceParamRaw ?? "");

  const {
    mutate: getGit,
    isPending: isPendingGit,
    isIdle: isIdleGit,
  } = useMutation({
    mutationFn: async () => {
      if (!gitParam || !branchParam || !fileParam) throw new TypeError("Missing Git parameters");
      if (provider === "github") {
        // gitParam is "owner/repo" for GitHub; extract repo name
        const repoName = gitParam.includes("/") ? gitParam.split("/")[1] : gitParam;
        return fetchFileContentFromGitHub(repoName, branchParam, fileParam);
      }
      return fetchFileContentFromAzure(gitParam, branchParam, fileParam);
    },
    onSuccess: (md) => {
      const fileName = fileParam.split("/").at(-1)!;
      let systemName: string;

      if (provider === "github") {
        const repoName = gitParam!.includes("/") ? gitParam!.split("/")[1] : gitParam!;
        systemName =
          allowedRepos.find(
            (r) =>
              r.provider === "github" &&
              r.repoName === repoName &&
              r.onlyPaths.some((p) => fileParam.includes(p)),
          )?.prettyName ?? "unknown";
      } else {
        systemName =
          allowedRepos.find(
            (r) =>
              r.provider === "azdo" &&
              r.id === gitParam &&
              r.onlyPaths.some((p) => fileParam.includes(p)),
          )?.prettyName ?? "unknown";
      }

      onLoad(md);
      setLastLoadedFile({
        fileName: getLoadedRepoFileName({ systemName, fileName }),
        tags: null,
      });
      addToast("info", `Loaded ${fileName} from Git`);
    },
    onError: (error) => {
      console.error("Error loading file from Git:", error);
      if (error instanceof Error) {
        addToast("error", error.message);
      }
    },
  });

  const { data: workspaceList } = useQueryWorkspaceFiles({
    enabled: Boolean(workspaceParam),
  });

  const {
    mutate: getWorkspaceFile,
    isPending: isPendingWorkspaceFile,
    isIdle: isIdleWorkspaceFile,
  } = useLoadFile({
    onSuccess: (value) => {
      if (!value) return console.error(`File was empty`);
      const { md, fileName, tags } = value;
      onLoad(md);
      setLastLoadedFile({ fileName: getLoadedWorkspaceName(fileName), tags });
      addToast("info", `Loaded ${workspaceParam} from workspace`);
    },
    onError: (error) => {
      console.error("Error loading file from workspace:", error);
      if (error instanceof Error) {
        addToast("error", error.message);
      }
    },
  });

  const loadFromAppropriateSource = useEffectEvent(
    ({
      isEditorReady,
      isIdleGit,
      isIdleWorkspaceFile,
      gitParam,
      workspaceParam,
      workspaceList,
    }: {
      isEditorReady: boolean;
      isIdleGit: boolean;
      isIdleWorkspaceFile: boolean;
      gitParam: string | null;
      workspaceParam: string;
      workspaceList: BucketFile[] | undefined;
    }) => {
      if (!isEditorReady || !isIdleGit || !isIdleWorkspaceFile) return;

      if (gitParam) return getGit();

      if (!workspaceParam || !workspaceList) return;

      const file = workspaceList.find((f) => {
        if (!f.Key) return false;
        const { fileName } = extractTags(f.Key);
        return fileName === workspaceParam;
      });
      if (!file) return addToast("error", `File ${workspaceParam} not found in workspace`);

      getWorkspaceFile(file.Key);
    },
  );

  useEffect(() => {
    loadFromAppropriateSource({
      isEditorReady,
      isIdleGit,
      isIdleWorkspaceFile,
      gitParam,
      workspaceParam,
      workspaceList,
    });
  }, [gitParam, isEditorReady, isIdleGit, isIdleWorkspaceFile, workspaceList, workspaceParam]);

  return isPendingGit || isPendingWorkspaceFile;
}
