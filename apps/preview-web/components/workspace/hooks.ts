import { deleteFile, getFile, listFiles, uploadFile } from "@/actions/s3";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_FILES = "workspace";

export function useQueryWorkspaceFiles() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => listFiles(),
  });
}

export function useLoadFile() {
  return useMutation({
    mutationKey: [QUERY_KEY_FILES],
    mutationFn: (s3Key: string) => getFile(s3Key),
  });
}

export function useUploadFile(skipInvalidation = false) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["uploadFile"],
    mutationFn: ({ key, content }: { key: string; content: string }) => uploadFile(key, content),
    onSuccess: () => {
      if (!skipInvalidation) {
        return queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FILES] });
      }
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["deleteFile"],
    mutationFn: (key: string) => deleteFile(key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FILES] }),
  });
}
