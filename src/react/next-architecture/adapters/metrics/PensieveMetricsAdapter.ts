import { Bucket } from 'aws-sdk/clients/s3';
import {
  AccountLatestUsedCapacity,
  BucketLatestUsedCapacity,
  LocationLatestUsedCapacity,
  IMetricsAdapter,
} from './IMetricsAdapter';

export class PensieveMetricsAdapter implements IMetricsAdapter {
  listBucketsLatestUsedCapacity(
    buckets: Bucket[],
  ): Promise<BucketLatestUsedCapacity[]> {
    throw new Error('Method not implemented.');
  }
  listLocationsLatestUsedCapacity(
    locationIds: string[],
  ): Promise<LocationLatestUsedCapacity[]> {
    throw new Error('Method not implemented.');
  }
  listAccountLocationsLatestUsedCapacity(
    accountCanonicalId: string,
  ): Promise<LocationLatestUsedCapacity[]> {
    throw new Error('Method not implemented.');
  }
  listAccountsLatestUsedCapacity(
    accountCanonicalIds: string[],
  ): Promise<AccountLatestUsedCapacity[]> {
    throw new Error('Method not implemented.');
  }
}
