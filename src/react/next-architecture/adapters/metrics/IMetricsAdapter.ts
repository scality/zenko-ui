import { Bucket } from 'aws-sdk/clients/s3';
import { LatestUsedCapacity } from '../../domain/entities/metrics';

export type AccountLatestUsedCapacity = {
  accountCanonicalId: string;
} & LatestUsedCapacity;
export type LocationLatestUsedCapacity = {
  locationId: string;
} & LatestUsedCapacity;

export interface IMetricsAdapter {
  listBucketsLatestUsedCapacity(
    buckets: Bucket[],
  ): Promise<Record<string, LatestUsedCapacity>>;
  listLocationsLatestUsedCapacity(
    locationIds: string[],
  ): Promise<LocationLatestUsedCapacity[]>;
  listAccountLocationsLatestUsedCapacity(
    accountCanonicalId: string,
  ): Promise<LocationLatestUsedCapacity[]>;
  listAccountsLatestUsedCapacity(
    accountCanonicalIds: string[],
  ): Promise<AccountLatestUsedCapacity[]>;
}
