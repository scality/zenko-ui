import { AWSError, S3 } from 'aws-sdk';
import { Bucket } from 'aws-sdk/clients/s3';
import { useMemo } from 'react';
import {
  useQueries,
  useQuery,
  useQueryClient,
  useIsFetching,
} from 'react-query';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import { useS3Client } from '../../ui/S3ClientProvider';
import {
  BucketLatestUsedCapacityPromiseResult,
  BucketLocationConstraintPromiseResult,
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

export const queries = {
  listBuckets: (s3Client: S3) => ({
    queryKey: ['buckets'],
    queryFn: () => s3Client.listBuckets().promise(),
    ...noRefetchOptions,
  }),
  getBucketLocation: (s3Client: S3, bucketName?: string) => ({
    queryKey: ['bucketLocation', bucketName],
    queryFn: () =>
      s3Client
        .getBucketLocation({ Bucket: notFalsyTypeGuard(bucketName) })
        .promise(),
    enabled: !!bucketName,
    ...noRefetchOptions,
  }),
  getBucketMetrics: (
    metricsAdapter: IMetricsAdapter,
    buckets: Bucket[],
    useSpecificCacheKey?: boolean,
  ) => ({
    queryKey: [
      'bucketMetrics',
      useSpecificCacheKey ? buckets.map((bucket) => bucket.Name).join(',') : '',
    ],
    queryFn: () => metricsAdapter.listBucketsLatestUsedCapacity(buckets),
    enabled: !!buckets.length,
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
  const {
    data: buckets,
    status: bucketsStatus,
    error,
  } = useQuery(queries.listBuckets(s3Client));

  useQueries(
    Array.from({ length: 20 }).map((_, index) =>
      queries.getBucketLocation(s3Client, buckets?.Buckets?.[index]?.Name),
    ),
  );

  //This hooks forces watching the individual bucket location queries
  //triggered by useBucketLocationConstraint
  useIsFetching([queries.getBucketLocation(s3Client, '').queryKey[0]]);

  const bucketsForWhichToFetchMetrics = buckets?.Buckets?.slice(0, 1_000) || [];
  const metricsQueryResult = useQuery(
    queries.getBucketMetrics(metricsAdapter, bucketsForWhichToFetchMetrics),
  );

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
  const { data, status } = useQuery({
    ...queries.getBucketMetrics(metricsAdapter, [{ Name: bucketName }], true),
  });
  const queryClient = useQueryClient();
  const allBucketsMetricsQuery = queryClient.getQueryState<
    Record<string, LatestUsedCapacity>
  >(queries.getBucketMetrics(metricsAdapter, [{ Name: bucketName }]).queryKey);
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
