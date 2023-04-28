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
  listBucketsLatestUsedCapacity(
    buckets: Bucket[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    throw new Error('Method not implemented.');
  }
  async listLocationsLatestUsedCapacity(
    locationIds: string[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    return this.managementClient
      .getStorageConsumptionMetricsForLocations(this.instanceId, locationIds)
      .then((locationsMetrics) => {
        const locationIds = Object.keys(locationsMetrics);

        const locationsLatestUsedCapacityList: Record<
          string,
          LatestUsedCapacity
        > = {};

        locationIds.forEach((id) => {
          if (locationsMetrics[id].type === 'hasMetrics') {
            locationsLatestUsedCapacityList[id] = {
              type: 'hasMetrics',
              usedCapacity: notFalsyTypeGuard(
                locationsMetrics[id].usedCapacity,
              ),
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
      });
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
