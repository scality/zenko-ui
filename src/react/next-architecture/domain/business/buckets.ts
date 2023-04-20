import { AWSError, S3 } from 'aws-sdk';
import { useQueries, useQuery } from 'react-query';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import { useS3Client } from '../../ui/S3ClientProvider';
import {
  BucketLatestUsedCapacityPromiseResult,
  BucketLocationConstraintPromiseResult,
  BucketsPromiseResult,
} from '../entities/bucket';
import { PromiseResult } from '../entities/promise';

export const DEFAULT_LOCATION = 'us-east-1';

const noRefetchOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};

const queries = {
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
  const {
    data: buckets,
    status: bucketsStatus,
    error,
  } = useQuery(queries.listBuckets(s3Client));

  const bucketLocationQueriesResult = useQueries(
    Array.from({ length: 20 }).map((_, index) =>
      queries.getBucketLocation(s3Client, buckets?.Buckets?.[index]?.Name),
    ),
  );

  if (bucketsStatus === 'loading' || bucketsStatus === 'idle') {
    return {
      buckets: {
        status: bucketsStatus,
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
    buckets?.Buckets?.map((bucket, index) => {
      let locationConstraint: PromiseResult<string> = {
        status: 'idle' as const,
      };
      if (bucketLocationQueriesResult[index]?.status === 'loading') {
        locationConstraint = {
          status: 'loading' as const,
        };
      } else if (bucketLocationQueriesResult[index]?.status === 'error') {
        locationConstraint = {
          status: 'error' as const,
          title: 'An error occurred while fetching the location',
          reason: 'Internal Server Error',
        };
      } else if (bucketLocationQueriesResult[index]?.status === 'success') {
        locationConstraint = {
          status: 'success' as const,
          value:
            bucketLocationQueriesResult[index].data?.LocationConstraint ??
            DEFAULT_LOCATION,
        };
      }

      return {
        name: bucket.Name || '',
        creationDate: bucket.CreationDate || new Date(),
        locationConstraint,
        usedCapacity: {
          status: 'idle' as const,
        },
      };
    }) || [];
  return {
    buckets: {
      status: 'success' as const,
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
  throw new Error('Method not implemented.');
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
  throw new Error('Method not implemented.');
};
