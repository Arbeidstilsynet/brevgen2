import { deleteFile, getFile, listFiles, uploadFile, type BucketFile } from "@/actions/gcp-bucket";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { createKey, extractTags } from "./utils";

const QUERY_KEY_FILES = "workspace";

export function useQueryWorkspaceFiles(
  options?: Omit<UseQueryOptions<BucketFile[] | undefined>, "queryKey" | "queryFn">,
) {
  const { status } = useSession();
  return useQuery({
    queryKey: [QUERY_KEY_FILES],
    queryFn: () => listFiles(),
    ...options,
    enabled: status === "authenticated" && (options?.enabled ?? true),
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
  const { data: session } = useSession();

  return useMutation({
    mutationKey: ["uploadFile"],
    mutationFn: ({ key, content }: { key: string; content: string }) => {
      const fileInfo = extractTags(key);

      // always attribute saved changes to current user
      const newKey = createKey({
        ...fileInfo,
        fullName: session?.user?.name ?? undefined,
      });

      return uploadFile(newKey, content);
    },
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
