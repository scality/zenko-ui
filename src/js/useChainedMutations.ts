/* eslint @typescript-eslint/no-unused-vars: 0 */
import { useRef } from 'react';

type ChainedMutation<
  TVariables = unknown,
  TData = unknown,
  TKey extends string = '',
> = {
  mutate: (
    variables: TVariables,
    mutationOptions: { onSuccess: (data: TData) => void },
  ) => void;
  isSuccess: boolean;
  data: TData;
  key: TKey;
};

declare type InferChainedMutation<T> = T extends ChainedMutation<
  infer TVariables,
  infer TData,
  infer TKey
>
  ? ChainedMutation<TVariables, TData, TKey>
  : ChainedMutation<unknown, unknown, ''>;

type ChainedMutationsResults<T extends unknown[]> = T extends []
  ? []
  : T extends [infer Head, ...infer Tail]
  ? [InferChainedMutation<Head>, ...ChainedMutationsResults<Tail>]
  : T extends [infer Head]
  ? [InferChainedMutation<Head>]
  : unknown[] extends T
  ? T
  : never;

type ExtractVariables<T> = T extends ChainedMutation<
  infer TVariables,
  infer TData,
  infer TKey
>
  ? TVariables
  : never;

type ExtractData<T> = T extends ChainedMutation<
  infer TVariables,
  infer TData,
  infer TKey
>
  ? TData
  : never;

type ExtractDataFromChainedMutaionTuple<T> = T extends []
  ? []
  : T extends [infer Head, ...infer Tail]
  ? [ExtractData<Head>, ...ExtractDataFromChainedMutaionTuple<Tail>]
  : T extends [infer Head]
  ? [ExtractData<Head>]
  : never;

type ExtractKey<T> = T extends ChainedMutation<
  infer TVariables,
  infer TData,
  infer TKey
>
  ? TKey
  : never;

type ComputeVariableForNext<TupleOfResult extends unknown[], TNextVariables> = (
  results: TupleOfResult,
) => TNextVariables;

type ComputeVariablesForNext<T extends unknown[]> = T extends []
  ? Record<string, unknown>
  : T extends [...infer Head, infer Tail]
  ? ComputeVariablesForNext<Head> &
      Record<
        ExtractKey<Tail>,
        ComputeVariableForNext<
          ExtractDataFromChainedMutaionTuple<Head>,
          ExtractVariables<Tail>
        >
      >
  : T extends [infer Head]
  ? Record<ExtractKey<Head>, ComputeVariableForNext<[], ExtractVariables<Head>>>
  : Record<string, unknown>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
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
    const compute = computeVariablesForNext[
      mutations[index].key
    ] as ComputeVariableForNext<unknown[], unknown>;

    const mutateAndTriggerNext = () => {
      mutations[index].mutate(compute(results), {
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
