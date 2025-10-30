import { useState } from 'react';
// Use a generic type to avoid React Query version conflicts
// This allows both v3 and v5 mutation results to be used
export type Mutation = {
  mutate: (variables?: any, options?: any) => void;
  mutateAsync: (variables?: any) => Promise<any>;
  status: 'idle' | 'pending' | 'error' | 'success'; // React Query v5 uses 'pending' instead of 'loading'
  data?: any;
  error?: any;
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  isPending?: boolean; // React Query v5 property
  reset?: () => void;
};

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
