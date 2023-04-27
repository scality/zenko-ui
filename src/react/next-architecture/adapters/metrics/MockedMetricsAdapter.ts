import { Bucket } from 'aws-sdk/clients/s3';
import {
  ACCOUNT_CANONICAL_ID,
  ACCOUNT_METRICS,
  NEWLY_CREATED_ACCOUNT_CANONICAL_ID,
  NEWLY_CREATED_ACCOUNT_METRICS,
} from '../../../../js/mock/managementClientStorageConsumptionMetricsHandlers';
import { LatestUsedCapacity } from '../../domain/entities/metrics';
import { IMetricsAdapter } from './IMetricsAdapter';

export class MockedMetricsAdapter implements IMetricsAdapter {
  listBucketsLatestUsedCapacity = jest.fn();
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
  listAccountsLatestUsedCapacity = jest
    .fn()
    .mockImplementation(
      async (
        accountCanonicalIds: string[],
      ): Promise<Record<string, LatestUsedCapacity>> => {
        return Promise.resolve({
          [ACCOUNT_CANONICAL_ID]: ACCOUNT_METRICS,
          [NEWLY_CREATED_ACCOUNT_CANONICAL_ID]: NEWLY_CREATED_ACCOUNT_METRICS,
        });
      },
    );
}
