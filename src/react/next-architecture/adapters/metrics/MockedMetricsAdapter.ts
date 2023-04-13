import { Bucket } from 'aws-sdk/clients/s3';
import {
  ACCOUNT_CANONICAL_ID,
  ACCOUNT_METRICS,
  NEWLY_CREATED_ACCOUNT_CANONICAL_ID,
  NEWLY_CREATED_ACCOUNT_METRICS,
} from '../../../../js/mock/managementClientStorageConsumptionMetricsHandlers';
import {
  AccountLatestUsedCapacity,
  BucketLatestUsedCapacity,
  IMetricsAdapter,
  LocationLatestUsedCapacity,
} from './IMetricsAdapter';

export class MockedMetricsAdapter implements IMetricsAdapter {
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
  listAccountsLatestUsedCapacity = jest
    .fn()
    .mockImplementation(
      async (
        accountCanonicalIds: string[],
      ): Promise<AccountLatestUsedCapacity[]> => {
        return Promise.resolve([
          { accountCanonicalId: ACCOUNT_CANONICAL_ID, ...ACCOUNT_METRICS },
          {
            accountCanonicalId: NEWLY_CREATED_ACCOUNT_CANONICAL_ID,
            ...NEWLY_CREATED_ACCOUNT_METRICS,
          },
        ]);
      },
    );
}
