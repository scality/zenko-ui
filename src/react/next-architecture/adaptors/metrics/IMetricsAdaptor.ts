import { Bucket } from 'aws-sdk/clients/s3';
import { LatestUsedCapacity } from '../../domain/entities/metrics';

export type BucketLatestUsedCapacity = {
  bucketName: string;
} & LatestUsedCapacity;
export type AccountLatestUsedCapacity = {
  accountId: string;
} & LatestUsedCapacity;
export type LocationLatestUsedCapacity = {
  locationId: string;
} & LatestUsedCapacity;

export interface IMetricsAdaptor {
  listBucketsLatestUsedCapacity(
    buckets: Bucket[],
  ): Promise<BucketLatestUsedCapacity[]>;
  listLocationsLatestUsedCapacity(
    locationIds: string[],
  ): Promise<LocationLatestUsedCapacity[]>;
  listAccountLocationsLatestUsedCapacity(
    accountId: string,
  ): Promise<LocationLatestUsedCapacity[]>;
  listAccountsLatestUsedCapacity(
    accountIds: string[],
  ): Promise<AccountLatestUsedCapacity[]>;
}
