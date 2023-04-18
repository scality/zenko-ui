import { Bucket } from 'aws-sdk/clients/s3';
import { LatestUsedCapacity } from '../../domain/entities/metrics';

export type BucketLatestUsedCapacity = {
  bucketName: string;
} & LatestUsedCapacity;
export type AccountLatestUsedCapacity = {
  accountCanonicalId: string;
} & LatestUsedCapacity;
export type LocationLatestUsedCapacity = {
  locationId: string;
} & LatestUsedCapacity;

export interface IMetricsAdapter {
  listBucketsLatestUsedCapacity(
    buckets: Bucket[],
  ): Promise<BucketLatestUsedCapacity[]>;
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
