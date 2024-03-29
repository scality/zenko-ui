import { AWSError, S3 } from 'aws-sdk';
import { Bucket, ListBucketsOutput } from 'aws-sdk/clients/s3';
import { PromiseResult as AWSPromiseResult } from 'aws-sdk/lib/request';
import { useMemo } from 'react';
import {
  useIsFetching,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from 'react-query';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { useAssumedRole } from '../../../DataServiceRoleProvider';
import { useAuthGroups } from '../../../utils/hooks';
import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import { useS3Client } from '../../ui/S3ClientProvider';
import {
  BucketDefaultRetentionPromiseResult,
  BucketLatestUsedCapacityPromiseResult,
  BucketLocationConstraintPromiseResult,
  BucketTaggingPromiseResult,
  BucketVersionningPromiseResult,
  BucketsPromiseResult,
} from '../entities/bucket';
import { LatestUsedCapacity } from '../entities/metrics';
import { PromiseResult } from '../entities/promise';

export const DEFAULT_LOCATION = 'us-east-1';

const noRefetchOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};

export const queryKeys = {
  buckets: 'buckets',
  bucketVersioning: 'bucketVersioning',
  bucketDefaultRetention: 'bucketDefaultRetention',
  bucketLocation: 'bucketLocation',
  bucketMetrics: 'bucketMetrics',
  bucketTagging: 'bucketTagging',
};

export const queries = {
  listBuckets: (s3Client: S3, assumedRole?: string) => ({
    queryKey: [queryKeys.buckets, assumedRole],
    queryFn: () => s3Client.listBuckets().promise(),
    ...noRefetchOptions,
  }),
  getBucketVersioning: (s3Client: S3, bucketName?: string) => ({
    queryKey: [queryKeys.bucketVersioning, bucketName],
    queryFn: () =>
      s3Client
        .getBucketVersioning({ Bucket: notFalsyTypeGuard(bucketName) })
        .promise(),
    enabled: !!bucketName && !!s3Client.config.credentials?.accessKeyId,
    ...noRefetchOptions,
  }),
  getBucketDefaultRetention: (s3Client: S3, bucketName?: string) => ({
    queryKey: [queryKeys.bucketDefaultRetention, bucketName],
    queryFn: () =>
      s3Client
        .getObjectLockConfiguration({
          Bucket: notFalsyTypeGuard(bucketName),
        })
        .promise()
        .catch((err: AWSError) => {
          if (err.code === 'ObjectLockConfigurationNotFoundError') {
            return {
              ObjectLockConfiguration: { ObjectLockEnabled: 'Disabled' },
            };
          }
          throw err;
        }),
    enabled: !!bucketName && !!s3Client?.config?.credentials?.accessKeyId,
    ...noRefetchOptions,
  }),
  getBucketLocation: (s3Client: S3, bucketName?: string) => ({
    queryKey: [queryKeys.bucketLocation, bucketName],
    queryFn: () =>
      s3Client
        .getBucketLocation({ Bucket: notFalsyTypeGuard(bucketName) })
        .promise(),
    enabled: !!bucketName && !!s3Client.config.credentials?.accessKeyId,
    ...noRefetchOptions,
  }),
  getBucketMetrics: (
    metricsAdapter: IMetricsAdapter,
    buckets: Bucket[],
    useSpecificCacheKey?: boolean,
  ) => ({
    queryKey: [
      queryKeys.bucketMetrics,
      metricsAdapter,
      useSpecificCacheKey ? buckets.map((bucket) => bucket.Name).join(',') : '',
    ],
    queryFn: () => metricsAdapter.listBucketsLatestUsedCapacity(buckets),
    enabled: !!buckets.length,
    ...noRefetchOptions,
  }),
  getBucketTagging: (s3Client: S3, bucketName: string) => ({
    queryKey: [queryKeys.bucketTagging, bucketName],
    queryFn: () => s3Client.getBucketTagging({ Bucket: bucketName }).promise(),
    enabled: !!bucketName && !!s3Client.config.credentials?.accessKeyId,
    ...noRefetchOptions,
  }),
};

/**
 * The hook returns the full list of buckets plus the locations and metrics of the first 20 buckets.
 */
export const useListBucketsForCurrentAccount = ({
  metricsAdapter,
}: {
  metricsAdapter: IMetricsAdapter;
}): BucketsPromiseResult => {
  const s3Client = useS3Client();
  const queryClient = useQueryClient();
  const assumedRole = useAssumedRole();
  const assumedRoleArn = assumedRole?.AssumedRoleUser?.Arn;
  const {
    data: buckets,
    status: bucketsStatus,
    error,
  } = useQuery(queries.listBuckets(s3Client, assumedRoleArn));

  useQueries(
    Array.from({ length: 20 }).map((_, index) =>
      queries.getBucketLocation(s3Client, buckets?.Buckets?.[index]?.Name),
    ),
  );

  //This hooks forces watching the individual bucket location queries
  //triggered by useBucketLocationConstraint
  useIsFetching([queries.getBucketLocation(s3Client, '').queryKey[0]]);

  const { isStorageManager } = useAuthGroups();

  const bucketsForWhichToFetchMetrics = buckets?.Buckets?.slice(0, 1_000) || [];
  const metricsQueryResult = useQuery({
    ...queries.getBucketMetrics(metricsAdapter, bucketsForWhichToFetchMetrics),
    enabled:
      queries.getBucketMetrics(metricsAdapter, bucketsForWhichToFetchMetrics)
        .enabled && isStorageManager,
  });

  if (bucketsStatus === 'loading' || bucketsStatus === 'idle') {
    return {
      buckets: {
        status: 'loading',
      },
    };
  }

  if (bucketsStatus === 'error') {
    return {
      buckets: {
        status: 'error',
        title: 'An error occurred while fetching the buckets',
        reason: (error as AWSError).message,
      },
    };
  }

  const bucketsWithLocation =
    buckets?.Buckets?.map((bucket) => {
      let locationConstraint: PromiseResult<string> = {
        status: 'loading',
      };
      const bucketLocationQueryState =
        queryClient.getQueryState<S3.GetBucketLocationOutput>(
          queries.getBucketLocation(s3Client, bucket.Name).queryKey,
        );
      if (bucketLocationQueryState?.status === 'success') {
        locationConstraint = {
          status: 'success',
          value:
            bucketLocationQueryState.data?.LocationConstraint ||
            DEFAULT_LOCATION,
        };
      } else if (bucketLocationQueryState?.status === 'error') {
        locationConstraint = {
          status: 'error',
          title: 'An error occurred while fetching the location',
          reason: 'Internal Server Error',
        };
      }

      let usedCapacity: PromiseResult<LatestUsedCapacity> = {
        status: 'loading',
      };
      if (
        metricsQueryResult.status === 'error' &&
        bucketsForWhichToFetchMetrics.find((b) => b.Name === bucket.Name)
      ) {
        usedCapacity = {
          status: 'error',
          title: 'An error occurred while fetching the latest used capacity',
          reason: 'Internal Server Error',
        };
      } else if (
        metricsQueryResult.status === 'success' &&
        metricsQueryResult.data?.[bucket.Name || '']
      ) {
        usedCapacity = {
          status: 'success',
          value: metricsQueryResult.data?.[bucket.Name || ''],
        };
      }

      return {
        name: bucket.Name || '',
        creationDate: bucket.CreationDate || new Date(),
        locationConstraint,
        usedCapacity,
      };
    }) || [];
  return {
    buckets: {
      status: 'success',
      value: bucketsWithLocation,
    },
  };
};

export const useBucketVersionning = ({
  bucketName,
}: {
  bucketName: string;
}): BucketVersionningPromiseResult => {
  const s3Client = useS3Client();
  const { data, status } = useQuery({
    ...queries.getBucketVersioning(s3Client, bucketName),
  });

  if (status === 'loading' || status === 'idle') {
    return {
      versionning: {
        status: 'loading',
      },
    };
  }

  if (status === 'error') {
    return {
      versionning: {
        status: 'error',
        title: 'An error occurred while fetching the versionning',
        reason: 'Internal Server Error',
      },
    };
  }

  return {
    versionning: {
      status: 'success',
      value: (data?.Status as 'Enabled' | 'Suspended') || 'Disabled',
    },
  };
};

export const useBucketDefaultRetention = ({
  bucketName,
}: {
  bucketName: string;
}): BucketDefaultRetentionPromiseResult => {
  const s3Client = useS3Client();
  const { data, status } = useQuery({
    ...queries.getBucketDefaultRetention(s3Client, bucketName),
  });

  if (status === 'loading' || status === 'idle') {
    return {
      defaultRetention: {
        status: 'loading',
      },
    };
  }

  if (status === 'error') {
    return {
      defaultRetention: {
        status: 'error',
        title: 'An error occurred while fetching the default retention',
        reason: 'Internal Server Error',
      },
    };
  }

  return {
    defaultRetention: {
      status: 'success',
      value: data?.ObjectLockConfiguration || {},
    },
  };
};

export const useCreateBucket = () => {
  const s3Client = useS3Client();
  const queryClient = useQueryClient();
  const assumedRole = useAssumedRole();
  const assumedRoleArn = assumedRole?.AssumedRoleUser?.Arn;
  const createMutation = useMutation({
    mutationFn: (request: S3.Types.CreateBucketRequest) => {
      return s3Client.createBucket(request).promise();
    },
    onSuccess: () => {
      queryClient.resetQueries(
        queries.listBuckets(s3Client, assumedRoleArn).queryKey,
      );
    },
  });
  return createMutation;
};

export const useDeleteBucket = () => {
  const s3Client = useS3Client();
  const queryClient = useQueryClient();
  const assumedRole = useAssumedRole();
  const assumedRoleArn = assumedRole?.AssumedRoleUser?.Arn;
  const deleteMutation = useMutation({
    mutationFn: (request: S3.Types.DeleteBucketRequest) => {
      return s3Client.deleteBucket(request).promise();
    },
    onSuccess: (_, request) => {
      const listingQueryState = queryClient.getQueryState<ListBucketsOutput>(
        queries.listBuckets(s3Client, assumedRoleArn).queryKey,
      );
      if (listingQueryState?.status === 'success') {
        const newBuckets = listingQueryState.data?.Buckets?.filter(
          (bucket) => bucket.Name !== request.Bucket,
        );
        queryClient.setQueryData(
          queries.listBuckets(s3Client, assumedRoleArn).queryKey,
          {
            ...listingQueryState.data,
            Buckets: newBuckets,
          },
        );
      }
    },
  });
  return deleteMutation;
};

export const useDeleteObjects = (
  bucketName: string,
  onSuccessFn?: (data: S3.DeleteObjectsOutput) => void,
) => {
  const s3Client = useS3Client();
  const deleteMutation = useMutation<
    AWSPromiseResult<S3.Types.DeleteObjectsOutput, AWSError>,
    AWSError,
    S3.Types.DeleteObjectsRequest
  >({
    mutationFn: (request: S3.Types.DeleteObjectsRequest) => {
      return s3Client.deleteObjects(request).promise();
    },
    onSuccess: (data) => {
      onSuccessFn?.(data);
    },
  });

  return deleteMutation;
};

export const useChangeBucketVersionning = () => {
  const s3Client = useS3Client();
  const queryClient = useQueryClient();
  const changeMutation = useMutation({
    mutationFn: (request: S3.Types.PutBucketVersioningRequest) => {
      return s3Client.putBucketVersioning(request).promise();
    },
    onSuccess: (_, request) => {
      const versionningQueryState =
        queryClient.getQueryState<S3.GetBucketVersioningOutput>(
          queries.getBucketVersioning(s3Client, request.Bucket).queryKey,
        );
      if (versionningQueryState?.status === 'success') {
        queryClient.setQueryData(
          queries.getBucketVersioning(s3Client, request.Bucket).queryKey,
          {
            ...versionningQueryState.data,
            Status: request.VersioningConfiguration?.Status,
          },
        );
      }
    },
  });
  return changeMutation;
};

export const useChangeBucketDefaultRetention = () => {
  const s3Client = useS3Client();
  const queryClient = useQueryClient();
  const changeMutation = useMutation({
    mutationFn: (request: S3.Types.PutObjectLockConfigurationRequest) => {
      return s3Client.putObjectLockConfiguration(request).promise();
    },
    onSuccess: (_, request) => {
      const defaultRetentionQueryState =
        queryClient.getQueryState<S3.GetObjectLockConfigurationOutput>(
          queries.getBucketDefaultRetention(s3Client, request.Bucket).queryKey,
        );
      if (defaultRetentionQueryState?.status === 'success') {
        queryClient.setQueryData<S3.GetObjectLockConfigurationOutput>(
          queries.getBucketDefaultRetention(s3Client, request.Bucket).queryKey,
          {
            ...defaultRetentionQueryState.data,
            ObjectLockConfiguration: request.ObjectLockConfiguration,
          },
        );
      }
    },
  });
  return changeMutation;
};

/**
 * The hook returns the location constraint for a specific bucket.
 * It will be called within the Table Cell on demande.
 * @param bucketName name of the bucket
 */
export const useBucketLocationConstraint = ({
  bucketName,
}: {
  bucketName: string;
}): BucketLocationConstraintPromiseResult => {
  const s3Client = useS3Client();
  const { data, status } = useQuery({
    ...queries.getBucketLocation(s3Client, bucketName),
  });

  if (status === 'loading' || status === 'idle') {
    return {
      locationConstraint: {
        status: 'loading',
      },
    };
  }

  if (status === 'error') {
    return {
      locationConstraint: {
        status: 'error',
        title: 'An error occurred while fetching the location',
        reason: 'Internal Server Error',
      },
    };
  }

  return {
    locationConstraint: {
      status: 'success',
      value: data?.LocationConstraint || DEFAULT_LOCATION,
    },
  };
};

/**
 * The hook returns the latest used capacity for a specific bucket.
 * @param bucketName name of the bucket
 */
export const useBucketLatestUsedCapacity = ({
  metricsAdapter,
  bucketName,
}: {
  metricsAdapter: IMetricsAdapter;
  bucketName: string;
}): BucketLatestUsedCapacityPromiseResult => {
  const queryClient = useQueryClient();
  const allBucketsMetricsQuery = queryClient.getQueryState<
    Record<string, LatestUsedCapacity>
  >(queries.getBucketMetrics(metricsAdapter, [{ Name: bucketName }]).queryKey);
  const { isStorageManager } = useAuthGroups();
  const { data, status } = useQuery({
    ...queries.getBucketMetrics(metricsAdapter, [{ Name: bucketName }], true),
    enabled:
      ((allBucketsMetricsQuery?.status === 'success' &&
        !allBucketsMetricsQuery?.data?.[bucketName]) ||
        !allBucketsMetricsQuery?.status) &&
      isStorageManager,
  });

  useMemo(() => {
    if (status === 'success' && allBucketsMetricsQuery?.status === 'success') {
      queryClient.setQueryData<Record<string, LatestUsedCapacity>>(
        queries.getBucketMetrics(metricsAdapter, [{ Name: bucketName }])
          .queryKey,
        {
          ...allBucketsMetricsQuery.data,
          ...data,
        },
      );
    }
  }, [status, allBucketsMetricsQuery?.status]);

  if (
    allBucketsMetricsQuery?.status === 'success' &&
    allBucketsMetricsQuery?.data?.[bucketName]
  ) {
    return {
      usedCapacity: {
        status: 'success',
        value: allBucketsMetricsQuery.data?.[bucketName],
      },
    };
  }

  if (status === 'loading' || status === 'idle') {
    return {
      usedCapacity: {
        status: 'loading',
      },
    };
  }

  if (status === 'error') {
    return {
      usedCapacity: {
        status: 'error',
        title: 'An error occurred while fetching the latest used capacity',
        reason: 'Internal Server Error',
      },
    };
  }

  return {
    usedCapacity: {
      status: 'success',
      value: data?.[bucketName],
    },
  };
};

export const useBucketTagging = ({
  bucketName,
}: {
  bucketName: string;
}): BucketTaggingPromiseResult => {
  const s3Client = useS3Client();
  const { data, status, error } = useQuery({
    ...queries.getBucketTagging(s3Client, bucketName),
  });

  if (status === 'loading' || status === 'idle') {
    return {
      tags: {
        status: 'loading',
      },
    };
  }
  //@ts-expect-error fix this when you are working on it
  if (status === 'error' && error?.code === 'NoSuchTagSet') {
    return {
      tags: {
        status: 'success',
        value: {},
      },
    };
  }
  if (status === 'error') {
    return {
      tags: {
        status: 'error',
        title: 'An error occurred while fetching the tags',
        reason: 'Internal Server Error',
      },
    };
  }
  return {
    tags: {
      status: 'success',
      value: data?.TagSet?.reduce((acc, tag) => {
        acc[tag.Key] =
          new DOMParser().parseFromString(tag.Value, 'text/html').body
            .textContent || '';
        return acc;
      }, {} as Record<string, string>),
    },
  };
};
