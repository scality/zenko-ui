import { useCreateBucket } from '@scality/data-browser-library';
import { useMemo } from 'react';
import { isBucketAlreadyOwned } from '../steps/ApplyActionsStep/s3Errors';

type MutateOptions = { onSuccess?: (data: unknown) => void; onError?: (error: unknown) => void };

/**
 * Creating the source bucket is idempotent: the wizard states the bucket is reused
 * when it already exists, and the destination side already treats
 * BucketAlreadyOwnedByYou as success. Without this the chain stops on a rerun —
 * which is what a second, reverse-direction setup always hits.
 */
export const useCreateSourceBucketMutation = () => {
  const mutation = useCreateBucket();
  const alreadyOwned = isBucketAlreadyOwned(mutation.error);

  return useMemo(
    () => ({
      ...mutation,
      mutate: (variables: unknown, options?: MutateOptions) =>
        (mutation.mutate as (v: unknown, o?: MutateOptions) => void)(variables, {
          onSuccess: options?.onSuccess,
          onError: (error: unknown) =>
            isBucketAlreadyOwned(error) ? options?.onSuccess?.({}) : options?.onError?.(error),
        }),
      ...(alreadyOwned
        ? { status: 'success' as const, isSuccess: true, isError: false, error: null, data: mutation.data ?? {} }
        : {}),
    }),
    [mutation, alreadyOwned],
  );
};
