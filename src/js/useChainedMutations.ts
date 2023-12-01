import { useRef } from 'react';

type MinimalMutation<TVariables = unknown, TData = unknown> = {
  mutate: (
    variables: TVariables,
    mutationOptions: { onSuccess: (data: TData) => void },
  ) => void;
  isSuccess: boolean;
  data: TData;
};

export const useChainedMutations = ({
  mutations,
}: {
  mutations: MinimalMutation[];
}): {
  mutate: (
    computeVariablesForNext: (results: unknown[]) => unknown,
    index?: number,
  ) => unknown;
  mutationsWithRetry: (MinimalMutation & {
    status: 'loading' | 'success' | 'error';
    retry: () => void;
  })[];
} => {
  const mutationsWithRetry = useRef<
    (MinimalMutation & {
      status: 'loading' | 'success' | 'error';
      retry: () => void;
    })[]
    //@ts-expect-error initial value
  >(mutations);
  const go = (
    computeVariablesForNext: (results: unknown[]) => unknown,
    results: unknown[] = [],
  ) => {
    const index = results.length;
    const mutateAndTriggerNext = () => {
      mutations[index].mutate(computeVariablesForNext(results), {
        onSuccess: (data) => {
          if (index < mutations.length - 1) {
            go(computeVariablesForNext, [...results, data]);
          }
        },
      });
    };
    mutationsWithRetry.current[index].retry = () => {
      mutateAndTriggerNext();
    };
    mutateAndTriggerNext();
  };
  return { mutate: go, mutationsWithRetry: mutationsWithRetry.current };
};
