import { useRef } from 'react';

type ChainedMutation<TVariables = unknown, TData = unknown> = {
  mutate: (
    variables: TVariables,
    mutationOptions: { onSuccess: (data: TData) => void },
  ) => void;
  isSuccess: boolean;
  data: TData;
};

declare type InferChainedMutation<T> = T extends ChainedMutation<
  infer TVariables,
  infer TData
>
  ? ChainedMutation<TVariables, TData>
  : T extends ChainedMutation<infer TVariables, infer TData>
  ? ChainedMutation<TVariables, TData>
  : ChainedMutation<unknown, unknown>;

type ChainedMutationsResults<T extends any[]> = T extends []
  ? []
  : T extends [infer Head, ...infer Tail]
  ? [InferChainedMutation<Head>, ...ChainedMutationsResults<Tail>]
  : T extends [infer Head]
  ? [InferChainedMutation<Head>]
  : unknown[] extends T
  ? T
  : never;

type ExctractVariables<T> = T extends ChainedMutation<infer TVariables>
  ? TVariables
  : never;

type ComputeVariableForNext<TupleOfResult extends any[], TNextVariables> = (
  results: TupleOfResult,
) => TNextVariables;

type ComputeVariablesForNext<T extends any[]> = T extends []
  ? []
  : T extends [...infer Head, infer Tail]
  ? [
      ...ComputeVariablesForNext<Head>,
      ComputeVariableForNext<Head, ExctractVariables<Tail>>,
    ]
  : T extends [infer Head]
  ? [ComputeVariableForNext<unknown[], ExctractVariables<Head>>]
  : never;

export const useChainedMutations = <T extends any[]>({
  mutations,
  computeVariablesForNext,
}: {
  mutations: readonly [...ChainedMutationsResults<T>];
  computeVariablesForNext: ComputeVariablesForNext<T>;
}): {
  mutate: () => void;
  computeVariablesForNext: ComputeVariablesForNext<T>;
  mutationsWithRetry: (ChainedMutation & {
    status: 'loading' | 'success' | 'error';
    retry: () => void;
  })[];
} => {
  const mutationsWithRetry = useRef<
    (ChainedMutation & {
      status: 'loading' | 'success' | 'error';
      retry: () => void;
    })[]
    //@ts-expect-error initial value
  >(mutations);
  const go = (results: unknown[] = []) => {
    const index = results.length;

    const mutateAndTriggerNext = () => {
      mutations[index].mutate(computeVariablesForNext[index](results), {
        onSuccess: (data: unknown) => {
          if (index < mutations.length - 1) {
            go([...results, data]);
          }
        },
      });
    };
    mutationsWithRetry.current[index].retry = () => {
      mutateAndTriggerNext();
    };
    mutateAndTriggerNext();
  };
  return {
    mutate: () => go(),
    mutationsWithRetry: mutationsWithRetry.current,
    computeVariablesForNext,
  };
};
