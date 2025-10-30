import { useMemo, useCallback } from 'react';
import {
  useCreateBucket as useDBCreateBucket,
  usePutObject as useDBPutObject,
  useSetBucketTagging as useDBSetBucketTagging,
  useBuckets as useDBBuckets,
  useDeleteBucket as useDBDeleteBucket,
  useDeleteObjects as useDBDeleteObjects,
  useGetObject as useDBGetObject,
  useObjectMetadata as useDBObjectMetadata,
} from '@scality/data-browser-library';

import type {
  CreateBucketCommandInput,
  PutObjectCommandInput,
  PutBucketTaggingCommandInput,
  BucketLocationConstraint,
  GetObjectCommandInput,
  HeadObjectCommandInput,
} from '@scality/data-browser-library';

import {
  IS3Hooks,
  IS3HookFactory,
  S3OperationConfig,
  mergeConfigs,
} from '../../domain/interfaces/IS3Operations';

/**
 * DataBrowser Hook Factory Adapter
 *
 * Wraps data-browser-library hooks with config hierarchy support.
 * Implements the IS3HookFactory port interface.
 */
export class DataBrowserHookFactory implements IS3HookFactory {
  /**
   * Provider-level config (Priority 1 - lowest)
   * Set when factory is created
   */
  private providerConfig: S3OperationConfig;

  constructor(providerConfig: S3OperationConfig = {}) {
    this.providerConfig = providerConfig;
  }

  /**
   * Get the merged base config (Provider + Factory levels)
   */
  getBaseConfig(factoryConfig?: S3OperationConfig): S3OperationConfig {
    return mergeConfigs(this.providerConfig, factoryConfig);
  }
}

/**
 * Enrich CreateBucket parameters with config values
 * Mutation params have highest priority (only apply config if param is undefined)
 */
function enrichCreateBucketParams(
  params: CreateBucketCommandInput,
  config: S3OperationConfig,
): CreateBucketCommandInput {
  const enrichedParams = { ...params };

  if (
    config.locationConstraint &&
    !params.CreateBucketConfiguration?.LocationConstraint
  ) {
    enrichedParams.CreateBucketConfiguration = {
      ...params.CreateBucketConfiguration,
      LocationConstraint: config.locationConstraint as BucketLocationConstraint,
    };
  }

  if (
    config.objectLockEnabled !== undefined &&
    params.ObjectLockEnabledForBucket === undefined
  ) {
    enrichedParams.ObjectLockEnabledForBucket = config.objectLockEnabled;
  }

  return enrichedParams;
}

/**
 * Enrich PutObject parameters with config values
 * Mutation params have highest priority
 */
function enrichPutObjectParams(
  params: PutObjectCommandInput,
  config: S3OperationConfig,
): PutObjectCommandInput {
  const hasMetadata =
    (config.metadata && Object.keys(config.metadata).length > 0) ||
    (params.Metadata && Object.keys(params.Metadata).length > 0);

  return {
    ...params,
    ContentType: params.ContentType ?? config.contentType,
    ...(hasMetadata && {
      Metadata: {
        ...(config.metadata || {}),
        ...(params.Metadata || {}),
      },
    }),
  };
}

/**
 * Enrich SetBucketTagging parameters with config values
 * Mutation params have highest priority
 */
function enrichSetBucketTaggingParams(
  params: PutBucketTaggingCommandInput,
  config: S3OperationConfig,
): PutBucketTaggingCommandInput {
  if (!config.bucketTags || config.bucketTags.length === 0) {
    return params;
  }

  const existingTags = params.Tagging?.TagSet || [];
  const configTags = config.bucketTags;

  const mergedTagsMap = new Map<string, string>();
  configTags.forEach((tag) => mergedTagsMap.set(tag.Key, tag.Value));
  existingTags.forEach((tag) => mergedTagsMap.set(tag.Key, tag.Value));

  const mergedTags = Array.from(mergedTagsMap.entries()).map(
    ([Key, Value]) => ({ Key, Value }),
  );

  return {
    ...params,
    Tagging: {
      TagSet: mergedTags,
    },
  };
}

/**
 * React Hook to create S3 hooks bundle with proper Rules of Hooks compliance
 *
 * This hook wraps the DataBrowserHookFactory and creates React hooks correctly.
 * It must be called at the component level, not inside the factory class.
 *
 * Configuration Priority (highest to lowest):
 * 4. Mutation params: mutation.mutate({ Bucket: 'x', ObjectLockEnabledForBucket: true })
 * 3. Hook config: s3Hooks.useCreateBucket({ objectLockEnabled: true })
 * 2. Factory config: useDataBrowserHooks(factory, { region: 'us-east-1' })  ← This level
 * 1. Provider config: new DataBrowserHookFactory({ region: 'us-west-1' })
 *
 * @param factory - The DataBrowserHookFactory instance
 * @param factoryConfig - Priority 2 configuration
 * @returns Bundle of S3 hooks with config support
 *
 * @example
 * ```typescript
 * const factory = new DataBrowserHookFactory({ region: 'us-west-1' });
 * const s3Hooks = useDataBrowserHooks(factory, { region: 'eu-west-1' });
 * const createBucket = s3Hooks.useCreateBucket({ objectLockEnabled: true });
 * await createBucket.mutateAsync({ Bucket: 'my-bucket' });
 * ```
 */
export function useDataBrowserHooks(
  factory: IS3HookFactory,
  factoryConfig?: S3OperationConfig,
): IS3Hooks {
  const baseConfig = useMemo(
    () => factory.getBaseConfig(factoryConfig),
    [factory, factoryConfig],
  );

  const hooks = {
    useCreateBucket: (hookConfig?: S3OperationConfig) => {
      const dbMutation = useDBCreateBucket();
      const finalConfig = useMemo(
        () => mergeConfigs(baseConfig, hookConfig),
        [hookConfig],
      );

      const mutate = useCallback(
        (params: CreateBucketCommandInput, options?: any) => {
          dbMutation.mutate(
            enrichCreateBucketParams(params, finalConfig),
            options,
          );
        },
        [dbMutation.mutate, finalConfig],
      );

      const mutateAsync = useCallback(
        async (params: CreateBucketCommandInput) => {
          return dbMutation.mutateAsync(
            enrichCreateBucketParams(params, finalConfig),
          );
        },
        [dbMutation.mutateAsync, finalConfig],
      );

      return {
        ...dbMutation,
        mutate,
        mutateAsync,
      };
    },

    usePutObject: (hookConfig?: S3OperationConfig) => {
      const dbMutation = useDBPutObject();
      const finalConfig = useMemo(
        () => mergeConfigs(baseConfig, hookConfig),
        [hookConfig],
      );

      const mutate = useCallback(
        (params: PutObjectCommandInput, options?: any) => {
          dbMutation.mutate(
            enrichPutObjectParams(params, finalConfig),
            options,
          );
        },
        [dbMutation.mutate, finalConfig],
      );

      const mutateAsync = useCallback(
        async (params: PutObjectCommandInput) => {
          return dbMutation.mutateAsync(
            enrichPutObjectParams(params, finalConfig),
          );
        },
        [dbMutation.mutateAsync, finalConfig],
      );

      return {
        ...dbMutation,
        mutate,
        mutateAsync,
      };
    },

    useSetBucketTagging: (hookConfig?: S3OperationConfig) => {
      const dbMutation = useDBSetBucketTagging();
      const finalConfig = useMemo(
        () => mergeConfigs(baseConfig, hookConfig),
        [hookConfig],
      );

      const mutate = useCallback(
        (params: PutBucketTaggingCommandInput, options?: any) => {
          const enrichedParams = enrichSetBucketTaggingParams(
            params,
            finalConfig,
          );
          dbMutation.mutate(enrichedParams, options);
        },
        [dbMutation.mutate, finalConfig],
      );

      const mutateAsync = useCallback(
        async (params: PutBucketTaggingCommandInput) => {
          const enrichedParams = enrichSetBucketTaggingParams(
            params,
            finalConfig,
          );
          return dbMutation.mutateAsync(enrichedParams);
        },
        [dbMutation.mutateAsync, finalConfig],
      );

      return {
        ...dbMutation,
        mutate,
        mutateAsync,
      };
    },

    useBuckets: (_hookConfig?: S3OperationConfig) => {
      return useDBBuckets({});
    },

    useDeleteBucket: (_hookConfig?: S3OperationConfig) => {
      return useDBDeleteBucket();
    },

    useDeleteObjects: (_hookConfig?: S3OperationConfig) => {
      return useDBDeleteObjects();
    },

    useGetObject: (
      params: GetObjectCommandInput,
      _hookConfig?: S3OperationConfig,
    ) => {
      return useDBGetObject(params);
    },

    useObjectMetadata: (
      params: HeadObjectCommandInput,
      _hookConfig?: S3OperationConfig,
    ) => {
      return useDBObjectMetadata(params);
    },
  } as unknown as IS3Hooks;

  return hooks;
}
