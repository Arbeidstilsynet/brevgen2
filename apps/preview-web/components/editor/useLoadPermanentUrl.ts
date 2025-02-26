"use client";

import { fetchFileContentFromAzure } from "@/actions/azdo";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

  const gitParam = params.get(GIT_PARAMS.git);
  const branchParam = params.get(GIT_PARAMS.branch);
  const fileParam = params.get(GIT_PARAMS.file);

  const workspaceParam = params.get(URL_SEARCH_PARAM_WORKSPACE);
  const decodedParam = decodeURIComponent(workspaceParam ?? "");

  const {
    data: filesData,
    isSuccess: isSuccessFiles,
    isPending: isPendingFiles,
  } = useQueryWorkspaceFiles();
  const { isPending: isPendingLoad, isSuccess: isSuccessLoad, mutate } = useLoadFile();

  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!isEditorReady || isLoading || hasLoaded) return;

    // If git parameters are provided, they take precedence.
    if (gitParam) {
      if (!branchParam || !fileParam) return;
      setIsLoading(true);
      const decodedFileParam = decodeURIComponent(fileParam);
      fetchFileContentFromAzure(gitParam, branchParam, decodedFileParam)
        .then((md) => {
          onLoad(md);
        })
        .catch((error) => {
          console.error("Error loading file from Git:", error);
        })
        .finally(() => {
          setIsLoading(false);
          setHasLoaded(true);
        });
      return;
    }

    // Otherwise, use workspace permanent URL logic.
    if (!decodedParam) return;
    if (!filesData || !isSuccessFiles || isPendingFiles) return;
    if (isPendingLoad || isSuccessLoad) return;

    const file = filesData.find((f) => {
      if (!f.Key) return false;
      const { fileName } = extractTags(f.Key);
      return fileName === decodedParam;
    });
    if (!file) return;

    setIsLoading(true);
    mutate(file.Key!, {
      onSuccess: (md) => {
        onLoad(md ?? "");
      },
      onSettled: () => {
        setIsLoading(false);
      },
    });
  }, [
    branchParam,
    decodedParam,
    fileParam,
    filesData,
    gitParam,
    hasLoaded,
    isEditorReady,
    isLoading,
    isPendingFiles,
    isPendingLoad,
    isSuccessFiles,
    isSuccessLoad,
    mutate,
    onLoad,
    workspaceParam,
  ]);

  return isLoading;
}
