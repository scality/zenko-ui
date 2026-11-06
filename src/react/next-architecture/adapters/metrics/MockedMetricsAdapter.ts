import type { LatestUsedCapacity, StorageUsageReport } from '../../domain/entities/metrics';
import type { IMetricsAdapter } from './IMetricsAdapter';

export const DEFAULT_METRICS_MESURED_ON = new Date('2022-03-18');
export const DEFAULT_METRICS: LatestUsedCapacity = {
  type: 'hasMetrics',
  usedCapacity: {
    current: 1024,
    nonCurrent: 0,
  },
  measuredOn: DEFAULT_METRICS_MESURED_ON,
};

export const DEFAULT_STORAGE_USAGE_REPORT: StorageUsageReport = {
  accounts: {
    'account-s3': { 'artesca-s3-location': 1024 },
    'account-jaguar': { 'artesca-jaguar-location': 1024 },
    'account-builtin': { 'us-east-1': 1024 },
  },
  retrievedOn: DEFAULT_METRICS_MESURED_ON,
};

export class MockedMetricsAdapter implements IMetricsAdapter {
  listBucketsLatestUsedCapacity = jest.fn();
  getStorageUsageReport = jest.fn().mockResolvedValue(DEFAULT_STORAGE_USAGE_REPORT);
}
