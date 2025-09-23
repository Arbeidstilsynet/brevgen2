"use client";

import { fetchFileContentFromAzure } from "@/actions/azdo";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { allowedRepos } from "../config/selectableRepos";
import { useToast } from "../toast/provider";
import { useLoadFile, useQueryWorkspaceFiles } from "../workspace/hooks";
import { extractTags, URL_SEARCH_PARAM_WORKSPACE } from "../workspace/utils";
import { getLoadedRepoFileName, getLoadedWorkspaceName, LastLoadedFile } from "./utils";

export const GIT_PARAMS = {
  git: "git",
  branch: "branch",
  file: "file",
} as const;

/**
 * Load a file from the workspace or Git based on seach params
 */
export function useLoadPermanentUrl(
  isEditorReady: boolean,
  onLoad: (md: string) => void,
  setLastLoadedFile: (file: LastLoadedFile) => void,
) {
  const params = useSearchParams()!;
  const { addToast } = useToast();

  const gitParam = params.get(GIT_PARAMS.git);
  const branchParam = params.get(GIT_PARAMS.branch);
  const fileParam = params.get(GIT_PARAMS.file);
  const decodedFileParam = decodeURIComponent(fileParam ?? "");

  // If git parameters are provided, they take precedence.
  const workspaceParam = !gitParam ? params.get(URL_SEARCH_PARAM_WORKSPACE) : null;
  const decodedWorkspaceParam = decodeURIComponent(workspaceParam ?? "");

  const {
    mutate: getGit,
    isPending: isPendingGit,
    isIdle: isIdleGit,
  } = useMutation({
    mutationFn: async () => {
      if (!gitParam || !branchParam || !fileParam) throw new TypeError("Missing Git parameters");
      return fetchFileContentFromAzure(gitParam, branchParam, decodedFileParam);
    },
    onSuccess: (md) => {
      const fileName = decodedFileParam.split("/").at(-1)!;
      const systemName =
        allowedRepos.find(
          (r) => r.id === gitParam && r.onlyPaths.some((p) => decodedFileParam.includes(p)),
        )?.prettyName ?? "unknown";

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

  const {
    data: workspaceList,
    isSuccess: isSuccessWorkspaceList,
    isPending: isPendingWorkspaceList,
  } = useQueryWorkspaceFiles({
    enabled: Boolean(decodedWorkspaceParam),
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
      addToast("info", `Loaded ${decodedWorkspaceParam} from workspace`);
    },
    onError: (error) => {
      console.error("Error loading file from workspace:", error);
      if (error instanceof Error) {
        addToast("error", error.message);
      }
    },
  });

  useEffect(() => {
    if (!isEditorReady || !isIdleGit || !isIdleWorkspaceFile) return;

    const loadFromAppropriateSource = () => {
      if (gitParam) return getGit();

      if (
        !decodedWorkspaceParam ||
        !isSuccessWorkspaceList ||
        !workspaceList ||
        isPendingWorkspaceList
      ) {
        return;
      }

      const file = workspaceList.find((f) => {
        if (!f.Key) return false;
        const { fileName } = extractTags(f.Key);
        return fileName === decodedWorkspaceParam;
      });
      if (!file) return addToast("error", `File ${decodedWorkspaceParam} not found in workspace`);

      getWorkspaceFile(file.Key!);
    };
    loadFromAppropriateSource();
  }, [
    addToast,
    decodedWorkspaceParam,
    getGit,
    getWorkspaceFile,
    gitParam,
    isEditorReady,
    isIdleGit,
    isIdleWorkspaceFile,
    isPendingWorkspaceList,
    isSuccessWorkspaceList,
    workspaceList,
  ]);

  return isPendingGit || isPendingWorkspaceFile;
}
