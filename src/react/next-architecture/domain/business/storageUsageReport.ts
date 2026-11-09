import { useQuery } from 'react-query';
import type { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import type { LatestUsedCapacity, StorageUsageReport } from '../entities/metrics';

// Building the report costs one Scuba call per account and location, while Scuba writes its
// latest metrics at most every 15 minutes, so a 5-minute cache rarely hides fresher numbers.
const STORAGE_USAGE_REPORT_STALE_TIME_MS = 5 * 60 * 1000;

export const useStorageUsageReport = ({
  metricsAdapter,
  enabled,
}: {
  metricsAdapter: IMetricsAdapter | undefined;
  enabled: boolean;
}) =>
  useQuery({
    queryKey: ['storageUsageReport'],
    queryFn: () => {
      if (!metricsAdapter) {
        throw new Error('A metrics adapter is required to fetch the storage usage report');
      }
      return metricsAdapter.getStorageUsageReport();
    },
    enabled: enabled && metricsAdapter !== undefined,
    staleTime: STORAGE_USAGE_REPORT_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    // Each attempt fetches every page of the report again, so do not use the default 3 retries.
    retry: 1,
    // Structural sharing copies changed objects key by key, which would turn an account or location named
    // `__proto__` into a prototype and drop it from the report.
    structuralSharing: false,
  });

// The report only provides a total per location, which the Data Used cell displays as is.
const toLatestUsedCapacity = (bytesUsed: number[], retrievedOn: Date): LatestUsedCapacity => {
  if (bytesUsed.length === 0) {
    return { type: 'noMetrics' };
  }
  return {
    type: 'hasMetrics',
    usedCapacity: { current: bytesUsed.reduce((total, bytes) => total + bytes, 0), nonCurrent: 0 },
    measuredOn: retrievedOn,
  };
};

// Names such as `constructor` are valid account and location names, so never read inherited keys.
const getOwnValue = <T>(record: Record<string, T>, key: string): T | undefined =>
  // biome-ignore lint/suspicious/noPrototypeBuiltins: Object.hasOwn is not in the es2021 lib this project builds with
  Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;

export const getAccountUsedCapacity = (report: StorageUsageReport, accountName: string): LatestUsedCapacity =>
  toLatestUsedCapacity(Object.values(getOwnValue(report.accounts, accountName) ?? {}), report.retrievedOn);

export const getLocationUsedCapacity = (report: StorageUsageReport, locationName: string): LatestUsedCapacity =>
  toLatestUsedCapacity(
    Object.values(report.accounts).flatMap((locationsUsage) => {
      const bytesUsed = getOwnValue(locationsUsage, locationName);
      return bytesUsed === undefined ? [] : [bytesUsed];
    }),
    report.retrievedOn,
  );

export const getAccountLocationUsedCapacity = (
  report: StorageUsageReport,
  accountName: string,
  locationName: string,
): LatestUsedCapacity | undefined => {
  const bytesUsed = getOwnValue(getOwnValue(report.accounts, accountName) ?? {}, locationName);
  return bytesUsed === undefined ? undefined : toLatestUsedCapacity([bytesUsed], report.retrievedOn);
};
