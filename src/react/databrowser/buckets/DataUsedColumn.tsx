import type { Bucket } from '@scality/data-browser-library';
import { useMetricsAdapter } from '../../next-architecture/ui/MetricsAdapterProvider';
import { UsedCapacityInlinePromiseResult } from '../../next-architecture/ui/metrics/LatestUsedCapacity';
import { useBucketMetrics } from '../hooks/useBucketMetrics';

export const DataUsedColumn = ({ data }: { data: Bucket }) => {
  const bucketName = data.Name;

  const metricsAdapter = useMetricsAdapter();
  const { usedCapacity } = useBucketMetrics({
    metricsAdapter,
    bucketName,
  });

  return <UsedCapacityInlinePromiseResult result={usedCapacity} />;
};
