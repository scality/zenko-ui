import { useBuckets } from '@scality/data-browser-library';
import { Bucket } from '@scality/data-browser-library';
import { useQuery, useQueryClient } from 'react-query';
import { useAuthGroups } from '../../utils/hooks';
import { IMetricsAdapter } from '../../next-architecture/adapters/metrics/IMetricsAdapter';
import { LatestUsedCapacity } from '../../next-architecture/domain/entities/metrics';
import { PromiseResult } from '../../next-architecture/domain/entities/promise';
import { useMetricsAdapter } from '../../next-architecture/ui/MetricsAdapterProvider';

export type BucketLatestUsedCapacityPromiseResult = {
  usedCapacity: PromiseResult<LatestUsedCapacity>;
};

// Query configuration constants
const BUCKET_METRICS_QUERY_KEY = 'bucketMetrics';
const noRefetchOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};

/**
 * Creates a React Query configuration for fetching bucket metrics.
 * Isolated from buckets.ts for data-browser-library usage.
 *
 * All buckets share a single cache entry for optimal performance.
 * The cache is populated by BucketMetricsPrefetch and consumed by useBucketMetrics.
 */
export const createBucketMetricsQuery = (
  metricsAdapter: IMetricsAdapter,
  buckets: Bucket[],
) => ({
  queryKey: [BUCKET_METRICS_QUERY_KEY],
  queryFn: () => metricsAdapter.listBucketsLatestUsedCapacity(buckets),
  enabled: !!buckets.length,
  ...noRefetchOptions,
});

/**
 * Hook to get bucket metrics from the batch prefetch cache.
 * This hook reads from the batch metrics cache populated by BucketMetricsPrefetch component.
 * It does NOT trigger individual API requests - it only reads from the shared cache.
 *
 * @param metricsAdapter - The metrics adapter instance
 * @param bucketName - Name of the bucket
 * @returns Bucket's latest used capacity from cache
 */
export const useBucketMetrics = ({
  metricsAdapter,
  bucketName,
}: {
  metricsAdapter: IMetricsAdapter;
  bucketName: string;
}): BucketLatestUsedCapacityPromiseResult => {
  const queryClient = useQueryClient();
  const allBucketsMetricsQuery = queryClient.getQueryState<
    Record<string, LatestUsedCapacity>
  >(createBucketMetricsQuery(metricsAdapter, []).queryKey);

  if (allBucketsMetricsQuery?.status === 'loading' || !allBucketsMetricsQuery) {
    return {
      usedCapacity: {
        status: 'loading',
      },
    };
  }

  if (allBucketsMetricsQuery?.status === 'error') {
    return {
      usedCapacity: {
        status: 'error',
        title: 'An error occurred while fetching the latest used capacity',
        reason: 'Internal Server Error',
      },
    };
  }

  if (
    allBucketsMetricsQuery?.status === 'success' &&
    allBucketsMetricsQuery?.data?.[bucketName]
  ) {
    return {
      usedCapacity: {
        status: 'success',
        value: allBucketsMetricsQuery.data[bucketName],
      },
    };
  }

  return {
    usedCapacity: {
      status: 'success',
      value: {
        type: 'noMetrics',
      },
    },
  };
};

/**
 * Component to prefetch all bucket metrics in a single batch request.
 * Must be rendered inside DataBrowserProvider to access the bucket list from library's React Query.
 * This component doesn't render anything visible - it only triggers data fetching.
 */
export const BucketMetricsPrefetch = () => {
  const { isStorageManager } = useAuthGroups();
  const metricsAdapter = useMetricsAdapter();

  const { data: bucketsData } = useBuckets();

  const bucketsForMetrics = bucketsData?.Buckets || [];

  useQuery({
    ...createBucketMetricsQuery(metricsAdapter, bucketsForMetrics),
    enabled: isStorageManager && bucketsForMetrics.length > 0,
  });

  return null;
};
