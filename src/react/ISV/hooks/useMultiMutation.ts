import { useState, useCallback, useRef } from 'react';

/**
 * Generic mutation type compatible with React Query v3 and v5.
 */
export type Mutation<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
> = {
  mutate: (
    variables?: TVariables,
    options?: {
      onSuccess?: (
        data: TData,
        variables: TVariables,
        context: TContext,
      ) => void;
      onError?: (
        error: TError,
        variables: TVariables,
        context: TContext,
      ) => void;
      onSettled?: (
        data: TData | undefined,
        error: TError | null,
        variables: TVariables,
        context: TContext,
      ) => void;
    },
  ) => void;
  mutateAsync: (variables?: TVariables) => Promise<TData>;
  status: 'idle' | 'pending' | 'error' | 'success';
  data?: TData;
  error?: TError;
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  isPending?: boolean;
  reset?: () => void;
};

type StoredMutation = Mutation<unknown, unknown, unknown, unknown>;

export function useMultiMutation<T>(items: T[], expectedTotal?: number) {
  const [mutations, setMutations] = useState<Record<string, StoredMutation>>(
    {},
  );

  const mutationRefs = useRef<Record<string, StoredMutation>>({});

  const handleMutationReady = useCallback(
    <TData, TError, TVariables, TContext>(
      key: string,
      mutation: Mutation<TData, TError, TVariables, TContext>,
    ): void => {
      mutationRefs.current[key] = mutation as StoredMutation;
      setMutations((prev) => ({
        ...prev,
        [key]: mutation as StoredMutation,
      }));
    },
    [],
  );

  const targetCount = expectedTotal ?? items.length;
  const isAllMutationsReady =
    targetCount === 0 || Object.keys(mutations).length >= targetCount;

  return {
    mutations,
    handleMutationReady,
    isAllMutationsReady,
  };
}
