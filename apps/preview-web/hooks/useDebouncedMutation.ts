import {
  DefaultError,
  UseMutationOptions,
  UseMutationResult,
  useMutation,
} from "@tanstack/react-query";
import { useCallback, useRef } from "react";

type DebouncedMutate<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = (
  variables: TVariables,
  {
    debounceMs,
    ...options
  }: UseMutationOptions<TData, TError, TVariables, TContext> & { debounceMs: number },
) => void;

type UseDebouncedMutationReturn<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = Omit<UseMutationResult<TData, TError, TVariables, TContext>, "mutate"> & {
  debouncedMutate: DebouncedMutate<TData, TError, TVariables, TContext>;
};

/**
 * Debounce a Tanstack Query mutation
 *
 * Based on https://github.com/TanStack/query/issues/293#issuecomment-1942398332
 */
export function useDebouncedMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseDebouncedMutationReturn<TData, TError, TVariables, TContext> {
  const { mutate, ...mutation } = useMutation<TData, TError, TVariables, TContext>(options);
  const timer = useRef<NodeJS.Timeout>(undefined);

  const debouncedMutate: DebouncedMutate<TData, TError, TVariables, TContext> = useCallback(
    (variables, { debounceMs }) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        mutate(variables);
      }, debounceMs);
    },
    [mutate],
  );

  return { debouncedMutate, ...mutation };
}
