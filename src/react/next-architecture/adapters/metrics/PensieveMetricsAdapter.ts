import type { Bucket } from '@scality/data-browser-library';
import makeMgtClient, { type UiFacingApiWrapper } from '../../../../js/managementClient';
import { StorageConsumptionMetricItemV1 } from '../../../../js/managementClient/api';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import type { LatestUsedCapacity, StorageUsageReport } from '../../domain/entities/metrics';
import type { IMetricsAdapter } from './IMetricsAdapter';

export class PensieveMetricsAdapter implements IMetricsAdapter {
  managementClient: UiFacingApiWrapper;
  constructor(
    private baseUrl: string,
    private instanceId: string,
    private getToken: () => Promise<string | null>,
  ) {
    this.managementClient = makeMgtClient(baseUrl, 'NOT_YET_AUTHENTICATED');
  }
  async listBucketsLatestUsedCapacity(buckets: Bucket[]): Promise<Record<string, LatestUsedCapacity>> {
    this.managementClient.setToken(await this.getToken());
    const bucketsMetrics = await this.managementClient.getStorageConsumptionMetricsForBuckets(
      this.instanceId,
      buckets.map((bucket) => `${bucket.Name}_${bucket.CreationDate?.getTime()}`),
    );
    return Object.keys(bucketsMetrics).reduce(
      (acc, bucketId) => {
        if (bucketsMetrics[bucketId].type === StorageConsumptionMetricItemV1.TypeEnum.HasMetrics) {
          acc[bucketId] = {
            type: 'hasMetrics',
            usedCapacity: notFalsyTypeGuard(bucketsMetrics[bucketId].usedCapacity),
            measuredOn: new Date(notFalsyTypeGuard(bucketsMetrics[bucketId].measuredOn)),
          };
        } else {
          acc[bucketId] = {
            type: 'noMetrics',
          };
        }
        return acc;
      },
      {} as Record<string, LatestUsedCapacity>,
    );
  }
  async getStorageUsageReport(): Promise<StorageUsageReport> {
    this.managementClient.setToken(await this.getToken());
    const accounts: StorageUsageReport['accounts'] = {};
    const seenMarkers = new Set<string>();
    let marker: string | undefined;
    do {
      const page = await this.managementClient.getReportingUsage(this.instanceId, marker);
      Object.entries(page.accounts ?? {}).forEach(([accountName, locations]) => {
        accounts[accountName] = Object.fromEntries(
          Object.entries(locations).map(([locationName, usage]) => [locationName, usage.bytesTotal ?? 0]),
        );
      });
      const nextMarker = page.isTruncated ? page.marker : undefined;
      if (nextMarker && seenMarkers.has(nextMarker)) {
        throw new Error('The storage usage report returned a page marker it already returned');
      }
      if (nextMarker) {
        seenMarkers.add(nextMarker);
      }
      marker = nextMarker;
    } while (marker);
    return { accounts, retrievedOn: new Date() };
  }
}
