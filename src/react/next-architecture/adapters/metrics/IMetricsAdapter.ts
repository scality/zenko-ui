import type { Bucket } from '@scality/data-browser-library';
import type { LatestUsedCapacity } from '../../domain/entities/metrics';

export interface IMetricsAdapter {
  listBucketsLatestUsedCapacity(buckets: Bucket[]): Promise<Record<string, LatestUsedCapacity>>;
  listLocationsLatestUsedCapacity(locationIds: string[]): Promise<Record<string, LatestUsedCapacity>>;
  listAccountLocationsLatestUsedCapacity(accountCanonicalId: string): Promise<Record<string, LatestUsedCapacity>>;
  listAccountsLatestUsedCapacity(accountCanonicalIds: string[]): Promise<Record<string, LatestUsedCapacity>>;
}
