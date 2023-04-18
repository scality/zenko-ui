import { Bucket } from 'aws-sdk/clients/s3';
import { LatestUsedCapacity } from '../../domain/entities/metrics';
import { IMetricsAdapter } from './IMetricsAdapter';

export class PensieveMetricsAdapter implements IMetricsAdapter {
  listBucketsLatestUsedCapacity(
    buckets: Bucket[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    throw new Error('Method not implemented.');
  }
  listLocationsLatestUsedCapacity(
    locationIds: string[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    throw new Error('Method not implemented.');
  }
  listAccountLocationsLatestUsedCapacity(
    accountCanonicalId: string,
  ): Promise<Record<string, LatestUsedCapacity>> {
    throw new Error('Method not implemented.');
  }
  listAccountsLatestUsedCapacity(
    accountCanonicalIds: string[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    throw new Error('Method not implemented.');
  }
}
