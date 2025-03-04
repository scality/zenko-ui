import { useState } from 'react';
import { UseMutationResult } from 'react-query';

export type Mutation = UseMutationResult<unknown, unknown, unknown, unknown>;

export function useMultiMutation<T>(items: T[], expectedTotal?: number) {
  const [mutations, setMutations] = useState<Record<string, Mutation>>({});

  const handleMutationReady = (key: string, mutation: Mutation) => {
    setMutations((prev) => ({
      ...prev,
      [key]: {
        key,
        ...mutation,
      },
    }));
  };

  const targetCount = expectedTotal ?? items.length;
  const isAllMutationsReady =
    targetCount === 0 || Object.keys(mutations).length >= targetCount;

  return {
    mutations,
    handleMutationReady,
    isAllMutationsReady,
  };
}
