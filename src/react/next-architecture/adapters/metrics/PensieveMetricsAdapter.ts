import { Bucket } from 'aws-sdk/clients/s3';
import { LatestUsedCapacity } from '../../domain/entities/metrics';
import { IMetricsAdapter } from './IMetricsAdapter';
import makeMgtClient from '../../../../js/managementClient';
import { UiFacingApi } from '../../../../js/managementClient/api';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';

export class PensieveMetricsAdapter implements IMetricsAdapter {
  managementClient: UiFacingApi;
  constructor(
    private baseUrl: string,
    private instanceId: string,
    private token: string,
  ) {
    this.managementClient = makeMgtClient(this.baseUrl, this.token);
  }
  async listBucketsLatestUsedCapacity(
    buckets: Bucket[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    const bucketsMetrics =
      await this.managementClient.getStorageConsumptionMetricsForBuckets(
        this.instanceId,
        buckets.map(
          (bucket) => `${bucket.Name}_${bucket.CreationDate?.getTime()}`,
        ),
      );
    return Object.keys(bucketsMetrics).reduce((acc, bucketId) => {
      if (bucketsMetrics[bucketId].type === 'hasMetrics') {
        acc[bucketId] = {
          type: 'hasMetrics',
          usedCapacity: notFalsyTypeGuard(
            bucketsMetrics[bucketId].usedCapacity,
          ),
          measuredOn: new Date(
            notFalsyTypeGuard(bucketsMetrics[bucketId].measuredOn),
          ),
        };
      } else {
        acc[bucketId] = {
          type: 'noMetrics',
        };
      }
      return acc;
    }, {} as Record<string, LatestUsedCapacity>);
  }
  async listLocationsLatestUsedCapacity(
    locationIds: string[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    const locationsMetrics =
      await this.managementClient.getStorageConsumptionMetricsForLocations(
        this.instanceId,
        locationIds,
      );

    const resultingLocationIds = Object.keys(locationsMetrics);

    const locationsLatestUsedCapacityList: Record<string, LatestUsedCapacity> =
      {};

    resultingLocationIds.forEach((id) => {
      if (locationsMetrics[id].type === 'hasMetrics') {
        locationsLatestUsedCapacityList[id] = {
          type: 'hasMetrics',
          usedCapacity: notFalsyTypeGuard(locationsMetrics[id].usedCapacity),
          measuredOn: new Date(
            notFalsyTypeGuard(locationsMetrics[id].measuredOn),
          ),
        };
      } else {
        locationsLatestUsedCapacityList[id] = {
          type: 'noMetrics',
        };
      }
    });

    return locationsLatestUsedCapacityList;
  }
  async listAccountLocationsLatestUsedCapacity(
    accountCanonicalId: string,
  ): Promise<Record<string, LatestUsedCapacity>> {
    const accountLocationsMetrics =
      await this.managementClient.getStorageConsumptionMetricsForAccount(
        this.instanceId,
        accountCanonicalId,
      );

    const resultingLocationIds = Object.keys(
      accountLocationsMetrics.locations || {},
    ) as (keyof typeof accountLocationsMetrics.locations)[];

    const accountLocationsLatestUsedCapacityList: Record<
      string,
      LatestUsedCapacity
    > = {};

    resultingLocationIds.forEach((id) => {
      if (accountLocationsMetrics.locations?.[id]) {
        accountLocationsLatestUsedCapacityList[id] = {
          type: 'hasMetrics',
          usedCapacity: notFalsyTypeGuard(
            accountLocationsMetrics.locations[id].usedCapacity,
          ),
          measuredOn: new Date(
            notFalsyTypeGuard(accountLocationsMetrics.measuredOn),
          ),
        };
      } else {
        accountLocationsLatestUsedCapacityList[id] = {
          type: 'noMetrics',
        };
      }
    });

    return accountLocationsLatestUsedCapacityList;
  }
  async listAccountsLatestUsedCapacity(
    accountCanonicalIds: string[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    const accountsMetrics =
      await this.managementClient.getStorageConsumptionMetricsForAccounts(
        this.instanceId,
        accountCanonicalIds,
      );

    const resultingAccountIds = Object.keys(accountsMetrics);

    const accountsLatestUsedCapacityList: Record<string, LatestUsedCapacity> =
      {};

    resultingAccountIds.forEach((id) => {
      if (accountsMetrics[id].type === 'hasMetrics') {
        accountsLatestUsedCapacityList[id] = {
          type: 'hasMetrics',
          usedCapacity: notFalsyTypeGuard(accountsMetrics[id].usedCapacity),
          measuredOn: new Date(
            notFalsyTypeGuard(accountsMetrics[id].measuredOn),
          ),
        };
      } else {
        accountsLatestUsedCapacityList[id] = {
          type: 'noMetrics',
        };
      }
    });

    return accountsLatestUsedCapacityList;
  }
}
