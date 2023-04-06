import { Bucket } from 'aws-sdk/clients/s3';
import {
  AccountLatestUsedCapacity,
  BucketLatestUsedCapacity,
  LocationLatestUsedCapacity,
  IMetricsAdaptor,
} from './IMetricsAdaptor';

export class PensieveMetricsAdaptor implements IMetricsAdaptor {
  listAccountLocationsLatestUsedCapacity(
    accountId: string,
  ): Promise<LocationLatestUsedCapacity[]> {
    throw new Error('Method not implemented.');
  }
  async listAccountsLatestUsedCapacity(
    accountIds: string[],
  ): Promise<AccountLatestUsedCapacity[]> {
    throw new Error('Method not implemented.');
  }
  async listBucketsLatestUsedCapacity(
    buckets: Bucket[],
  ): Promise<BucketLatestUsedCapacity[]> {
    throw new Error('Method not implemented.');
  }
  async listLocationsLatestUsedCapacity(
    locationIds: string[],
  ): Promise<LocationLatestUsedCapacity[]> {
    throw new Error('Method not implemented.');
  }
}
