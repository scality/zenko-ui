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

  async listLocationsLatestUsedCapacity(
    locationIds: string[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    const locationLastestUsedCapacity: Record<string, LatestUsedCapacity> = {};

    locationIds.forEach((id) => {
      locationLastestUsedCapacity[id] = {
        type: 'hasMetrics',
        usedCapacity: {
          current: 1024,
          nonCurrent: 10,
        },
        measuredOn: new Date('2022-03-18'),
      };
    });
    return locationLastestUsedCapacity;
  }
  async listAccountLocationsLatestUsedCapacity(
    accountCanonicalId: string,
  ): Promise<Record<string, LatestUsedCapacity>> {
    if (accountCanonicalId === 'account-id-renard') {
      return {
        'artesca-s3-location': {
          type: 'hasMetrics',
          usedCapacity: {
            current: 1024,
            nonCurrent: 10,
          },
          measuredOn: new Date('2022-03-18'),
        },
      };
    }

    if (accountCanonicalId === 'account-id-jaguar') {
      return {
        'artesca-jaguar-location': {
          type: 'hasMetrics',
          usedCapacity: {
            current: 1024,
            nonCurrent: 10,
          },
          measuredOn: new Date('2022-03-18'),
        },
      };
    }
    if (accountCanonicalId === 'account-id-with-orphan-metrics') {
      return {
        'orphan-location': {
          type: 'hasMetrics',
          usedCapacity: {
            current: 1024,
            nonCurrent: 10,
          },
          measuredOn: new Date('2022-03-18'),
        },
      };
    }
    return {};
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
