import type { Bucket } from '@scality/data-browser-library';
import type { LatestUsedCapacity, StorageUsageReport } from '../../domain/entities/metrics';

export interface IMetricsAdapter {
  listBucketsLatestUsedCapacity(buckets: Bucket[]): Promise<Record<string, LatestUsedCapacity>>;
  getStorageUsageReport(): Promise<StorageUsageReport>;
}
