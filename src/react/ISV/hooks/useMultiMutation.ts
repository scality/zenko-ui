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

  const isAllMutationsReady =
    Object.keys(mutations).length === (expectedTotal ?? items.length);

  return {
    mutations,
    handleMutationReady,
    isAllMutationsReady,
  };
}
