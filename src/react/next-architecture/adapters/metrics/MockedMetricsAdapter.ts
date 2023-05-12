import {
  ACCOUNT_CANONICAL_ID,
  ACCOUNT_METRICS,
  NEWLY_CREATED_ACCOUNT_CANONICAL_ID,
  NEWLY_CREATED_ACCOUNT_METRICS,
} from '../../../../js/mock/managementClientMSWHandlers';
import { LatestUsedCapacity } from '../../domain/entities/metrics';
import { IMetricsAdapter } from './IMetricsAdapter';

export const DEFAULT_METRICS_MESURED_ON = new Date('2022-03-18');
export const DEFAULT_METRICS: LatestUsedCapacity = {
  type: 'hasMetrics',
  usedCapacity: {
    current: 1024,
    nonCurrent: 10,
  },
  measuredOn: DEFAULT_METRICS_MESURED_ON,
};

export class MockedMetricsAdapter implements IMetricsAdapter {
  listBucketsLatestUsedCapacity = jest.fn();

  async listLocationsLatestUsedCapacity(
    locationIds: string[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    const locationLastestUsedCapacity: Record<string, LatestUsedCapacity> = {};

    locationIds.forEach((id) => {
      locationLastestUsedCapacity[id] = DEFAULT_METRICS;
    });
    return locationLastestUsedCapacity;
  }
  async listAccountLocationsLatestUsedCapacity(
    accountCanonicalId: string,
  ): Promise<Record<string, LatestUsedCapacity>> {
    if (accountCanonicalId === 'canonical-id-renard') {
      return {
        'artesca-s3-location': DEFAULT_METRICS,
      };
    }

    if (accountCanonicalId === 'account-id-jaguar') {
      return {
        'artesca-jaguar-location': DEFAULT_METRICS,
      };
    }
    if (accountCanonicalId === 'account-id-with-orphan-metrics') {
      return {
        'orphan-location': DEFAULT_METRICS,
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
