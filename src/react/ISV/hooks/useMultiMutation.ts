import { useState, useCallback } from 'react';
import { UseMutationResult } from 'react-query';

// v3 has isLoading, v5 has isPending
export type Mutation = UseMutationResult<unknown, unknown, unknown, unknown> & {
  isPending?: boolean;
  isLoading?: boolean;
};

export function useMultiMutation<T>(items: T[], expectedTotal?: number) {
  const [mutations, setMutations] = useState<Record<string, Mutation>>({});

  const handleMutationReady = useCallback((key: string, mutation: Mutation) => {
    const mutationWithKey = Object.assign(mutation, { key });

    setMutations((prev) => ({
      ...prev,
      [key]: mutationWithKey,
    }));
  }, []);

  const targetCount = expectedTotal ?? items.length;
  const isAllMutationsReady =
    targetCount === 0 || Object.keys(mutations).length >= targetCount;

  return {
    mutations,
    handleMutationReady,
    isAllMutationsReady,
  };
}
