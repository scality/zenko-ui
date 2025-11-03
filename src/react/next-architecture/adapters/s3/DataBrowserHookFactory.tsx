import { useMemo, useCallback, useContext, createContext } from 'react';
import {
  useCreateBucket as useDBCreateBucket,
  usePutObject as useDBPutObject,
  useSetBucketTagging as useDBSetBucketTagging,
  useBuckets,
  useDeleteBucket,
  useDeleteObjects,
  useGetObject,
  useObjectMetadata,
} from '@scality/data-browser-library';

import type {
  CreateBucketCommandInput,
  PutObjectCommandInput,
  PutBucketTaggingCommandInput,
  BucketLocationConstraint,
} from '@scality/data-browser-library';

import {
  IS3Hooks,
  S3OperationConfig,
  mergeConfigs,
} from '../../domain/interfaces/IS3Operations';

const S3ConfigContext = createContext<S3OperationConfig>({});

export const S3ConfigProvider = S3ConfigContext.Provider;

/**
 * Hook to use S3 operations with optional config override
 *
 * Directly wraps data-browser-library hooks without unnecessary factory pattern.
 * Only wraps hooks that actually need config enrichment.
 *
 * @param config - Optional config to override provider defaults
 * @returns Bundle of S3 hooks
 *
 * @example
 * ```typescript
 * const s3Hooks = useS3Hooks({ locationConstraint: 'us-east-1' });
 * const createBucket = s3Hooks.useCreateBucket();
 * await createBucket.mutateAsync({ Bucket: 'my-bucket' });
 * ```
 */
export function useS3Hooks(config?: S3OperationConfig): IS3Hooks {
  const providerConfig = useContext(S3ConfigContext);
  const finalConfig = useMemo(
    () => mergeConfigs(providerConfig, config),
    [providerConfig, config],
  );

  return useMemo(
    () => ({
      useCreateBucket: (hookConfig?: S3OperationConfig) => {
        const mutation = useDBCreateBucket();
        const cfg = useMemo(
          () => mergeConfigs(finalConfig, hookConfig),
          [hookConfig],
        );

        const enrichParams = useCallback(
          (params: CreateBucketCommandInput): CreateBucketCommandInput => ({
            ...params,
            ...(cfg.locationConstraint &&
              !params.CreateBucketConfiguration?.LocationConstraint && {
                CreateBucketConfiguration: {
                  ...params.CreateBucketConfiguration,
                  LocationConstraint:
                    cfg.locationConstraint as BucketLocationConstraint,
                },
              }),
            ...(cfg.objectLockEnabled !== undefined &&
              params.ObjectLockEnabledForBucket === undefined && {
                ObjectLockEnabledForBucket: cfg.objectLockEnabled,
              }),
          }),
          [cfg],
        );

        const mutate = useCallback(
          (params: CreateBucketCommandInput, options?: any) =>
            mutation.mutate(enrichParams(params), options),
          [mutation.mutate, enrichParams],
        );

        const mutateAsync = useCallback(
          async (params: CreateBucketCommandInput) =>
            mutation.mutateAsync(enrichParams(params)),
          [mutation.mutateAsync, enrichParams],
        );

        return { ...mutation, mutate, mutateAsync };
      },

      usePutObject: (hookConfig?: S3OperationConfig) => {
        const mutation = useDBPutObject();
        const cfg = useMemo(
          () => mergeConfigs(finalConfig, hookConfig),
          [hookConfig],
        );

        const enrichParams = useCallback(
          (params: PutObjectCommandInput): PutObjectCommandInput => ({
            ...params,
            ...(cfg.contentType &&
              !params.ContentType && { ContentType: cfg.contentType }),
          }),
          [cfg],
        );

        const mutate = useCallback(
          (params: PutObjectCommandInput, options?: any) =>
            mutation.mutate(enrichParams(params), options),
          [mutation.mutate, enrichParams],
        );

        const mutateAsync = useCallback(
          async (params: PutObjectCommandInput) =>
            mutation.mutateAsync(enrichParams(params)),
          [mutation.mutateAsync, enrichParams],
        );

        return { ...mutation, mutate, mutateAsync };
      },

      useSetBucketTagging: (hookConfig?: S3OperationConfig) => {
        const mutation = useDBSetBucketTagging();
        const cfg = useMemo(
          () => mergeConfigs(finalConfig, hookConfig),
          [hookConfig],
        );

        const enrichParams = useCallback(
          (
            params: PutBucketTaggingCommandInput,
          ): PutBucketTaggingCommandInput => {
            if (!cfg.bucketTags?.length) {
              return params;
            }

            const tagMap = new Map<string, string>();
            cfg.bucketTags.forEach((tag) => tagMap.set(tag.Key, tag.Value));
            (params.Tagging?.TagSet || []).forEach((tag) =>
              tagMap.set(tag.Key, tag.Value),
            );

            return {
              ...params,
              Tagging: {
                TagSet: Array.from(tagMap.entries()).map(([Key, Value]) => ({
                  Key,
                  Value,
                })),
              },
            };
          },
          [cfg],
        );

        const mutate = useCallback(
          (params: PutBucketTaggingCommandInput, options?: any) =>
            mutation.mutate(enrichParams(params), options),
          [mutation.mutate, enrichParams],
        );

        const mutateAsync = useCallback(
          async (params: PutBucketTaggingCommandInput) =>
            mutation.mutateAsync(enrichParams(params)),
          [mutation.mutateAsync, enrichParams],
        );

        return { ...mutation, mutate, mutateAsync };
      },

      useBuckets,
      useDeleteBucket,
      useDeleteObjects,
      useGetObject,
      useObjectMetadata,
    }),
    [finalConfig],
  );
}
