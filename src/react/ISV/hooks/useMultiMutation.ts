import { useState } from 'react';
import { UseMutationResult } from 'react-query';

export type MutationWithKey = UseMutationResult<
  unknown,
  unknown,
  unknown,
  unknown
> & {
  key: string;
};

export function useMultiMutation<T>(items: T[], expectedTotal?: number) {
  const [mutations, setMutations] = useState<Record<string, MutationWithKey>>(
    {},
  );

  const handleMutationReady = (key: string, mutation: MutationWithKey) => {
    setMutations((prev) => ({
      ...prev,
      [key]: mutation,
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
