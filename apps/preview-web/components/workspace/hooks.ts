import { deleteFile, getFile, listFiles, uploadFile } from "@/actions/s3";
import { _Object } from "@aws-sdk/client-s3";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { extractTags } from "./utils";

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

interface UseLoadFileReturn {
  md: string;
  fileName: string;
  tags: Set<string>;
}

export function useLoadFile(
  options?: Omit<
    UseMutationOptions<UseLoadFileReturn | undefined, Error, string>,
    "mutationKey" | "mutationFn"
  >,
) {
  return useMutation({
    mutationKey: [QUERY_KEY_FILES],
    mutationFn: async (s3Key: string) => {
      const md = await getFile(s3Key);
      if (typeof md !== "string") {
        throw new TypeError("getFile returned empty string or nullish");
      }
      const { fileName, tags } = extractTags(s3Key);
      return { md, fileName, tags };
    },
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
