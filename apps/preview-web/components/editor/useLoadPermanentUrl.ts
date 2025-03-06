"use client";

import { fetchFileContentFromAzure } from "@/actions/azdo";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "../toast/provider";
import { useLoadFile, useQueryWorkspaceFiles } from "../workspace/hooks";
import { extractTags, URL_SEARCH_PARAM_WORKSPACE } from "../workspace/utils";

export const GIT_PARAMS = {
  git: "git",
  branch: "branch",
  file: "file",
} as const;

/**
 * Load a file from the workspace or Git based on seach params
 */
export function useLoadPermanentUrl(isEditorReady: boolean, onLoad: (md: string) => void) {
  const params = useSearchParams();
  const { addToast } = useToast();

  const gitParam = params.get(GIT_PARAMS.git);
  const branchParam = params.get(GIT_PARAMS.branch);
  const fileParam = params.get(GIT_PARAMS.file);
  const decodedFileParam = decodeURIComponent(fileParam ?? "");

  // If git parameters are provided, they take precedence.
  const workspaceParam = !gitParam ? params.get(URL_SEARCH_PARAM_WORKSPACE) : null;
  const decodedParam = decodeURIComponent(workspaceParam ?? "");

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
      onLoad(md);
      const fileName = decodedFileParam.split("/").at(-1);
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
  } = useQueryWorkspaceFiles();

  const {
    mutate: getWorkspaceFile,
    isPending: isPendingWorkspaceFile,
    isIdle: isIdleWorkspaceFile,
  } = useLoadFile({
    onSuccess: (md) => {
      onLoad(md ?? "");
      addToast("info", `Loaded ${decodedParam} from workspace`);
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

      if (!decodedParam || !isSuccessWorkspaceList || isPendingWorkspaceList) return;

      const file = workspaceList.find((f) => {
        if (!f.Key) return false;
        const { fileName } = extractTags(f.Key);
        return fileName === decodedParam;
      });
      if (!file) return addToast("error", `File ${decodedParam} not found in workspace`);

      getWorkspaceFile(file.Key!);
    };
    loadFromAppropriateSource();
  }, [
    addToast,
    decodedParam,
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
