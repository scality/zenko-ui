import type {
  CreateBucketCommandInput,
  CreateBucketCommandOutput,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  PutBucketTaggingCommandInput,
  PutBucketTaggingCommandOutput,
  ListBucketsCommandOutput,
  DeleteBucketCommandInput,
  DeleteBucketCommandOutput,
  DeleteObjectsCommandInput,
  DeleteObjectsCommandOutput,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  HeadObjectCommandInput,
  HeadObjectCommandOutput,
  EnhancedS3Error,
} from '@scality/data-browser-library';

import type {
  UseMutationResult,
  UseQueryResult,
  UseQueryOptions,
} from '@tanstack/react-query';

type S3HookError = EnhancedS3Error;

export interface S3OperationConfig {
  region?: string;
  locationConstraint?: string;
  objectLockEnabled?: boolean;
  contentType?: string;
  metadata?: Record<string, string>;
  bucketTags?: Array<{ Key: string; Value: string }>;
  [key: string]: unknown;
}

export function mergeConfigs(
  ...configs: (S3OperationConfig | undefined)[]
): S3OperationConfig {
  return configs.reduce((merged, config) => {
    if (!config) return merged;

    const result = { ...merged, ...config };

    if (merged.bucketTags && config.bucketTags) {
      const tagMap = new Map<string, string>();
      merged.bucketTags.forEach((tag) => tagMap.set(tag.Key, tag.Value));
      config.bucketTags.forEach((tag) => tagMap.set(tag.Key, tag.Value));
      result.bucketTags = Array.from(tagMap.entries()).map(([Key, Value]) => ({
        Key,
        Value,
      }));
    }

    if (merged.metadata && config.metadata) {
      result.metadata = { ...merged.metadata, ...config.metadata };
    }

    return result;
  }, {} as S3OperationConfig);
}

export interface IS3Hooks {
  useCreateBucket: (
    config?: S3OperationConfig,
  ) => UseMutationResult<
    CreateBucketCommandOutput,
    S3HookError,
    CreateBucketCommandInput,
    unknown
  >;

  usePutObject: (
    config?: S3OperationConfig,
  ) => UseMutationResult<
    PutObjectCommandOutput,
    S3HookError,
    PutObjectCommandInput,
    unknown
  >;

  useSetBucketTagging: (
    config?: S3OperationConfig,
  ) => UseMutationResult<
    PutBucketTaggingCommandOutput,
    S3HookError,
    PutBucketTaggingCommandInput,
    unknown
  >;

  useBuckets: (
    params?: Record<string, unknown>,
    options?: Omit<
      UseQueryOptions<
        ListBucketsCommandOutput,
        S3HookError,
        ListBucketsCommandOutput,
        readonly unknown[]
      >,
      'queryFn' | 'queryKey'
    >,
  ) => UseQueryResult<ListBucketsCommandOutput, S3HookError>;

  useDeleteBucket: () => UseMutationResult<
    DeleteBucketCommandOutput,
    S3HookError,
    DeleteBucketCommandInput,
    unknown
  >;

  useDeleteObjects: () => UseMutationResult<
    DeleteObjectsCommandOutput,
    S3HookError,
    DeleteObjectsCommandInput,
    unknown
  >;

  useGetObject: (
    params: GetObjectCommandInput,
    options?: Omit<
      UseQueryOptions<
        GetObjectCommandOutput,
        S3HookError,
        GetObjectCommandOutput,
        readonly unknown[]
      >,
      'queryFn' | 'queryKey'
    >,
  ) => UseQueryResult<GetObjectCommandOutput, S3HookError>;

  useObjectMetadata: (
    params: HeadObjectCommandInput,
    options?: Omit<
      UseQueryOptions<
        HeadObjectCommandOutput,
        S3HookError,
        HeadObjectCommandOutput,
        readonly unknown[]
      >,
      'queryFn' | 'queryKey'
    >,
  ) => UseQueryResult<HeadObjectCommandOutput, S3HookError>;
}

