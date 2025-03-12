import { deleteFile, getFile, listFiles, uploadFile } from "@/actions/s3";
import { _Object } from "@aws-sdk/client-s3";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

const QUERY_KEY_FILES = "workspace";

export function useQueryWorkspaceFiles(
  options?: Omit<UseQueryOptions<_Object[] | undefined>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: [QUERY_KEY_FILES],
    queryFn: () => listFiles(),
    ...options,
  });
}

export function useLoadFile(
  options?: Omit<
    UseMutationOptions<string | undefined, Error, string>,
    "mutationKey" | "mutationFn"
  >,
) {
  return useMutation({
    mutationKey: [QUERY_KEY_FILES],
    mutationFn: (s3Key: string) => getFile(s3Key),
    ...options,
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
