import { useQuery } from 'react-query';
import type { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import type { LatestUsedCapacity, StorageUsageReport } from '../entities/metrics';

export const useStorageUsageReport = ({
  metricsAdapter,
  enabled,
}: {
  metricsAdapter: IMetricsAdapter;
  enabled: boolean;
}) =>
  useQuery({
    queryKey: ['storageUsageReport'],
    queryFn: () => metricsAdapter.getStorageUsageReport(),
    enabled,
    // The report is costly to compute (one Scuba call per account and location), fetch it once per session.
    staleTime: Number.POSITIVE_INFINITY,
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

export const getAccountUsedCapacity = (report: StorageUsageReport, accountName: string): LatestUsedCapacity =>
  toLatestUsedCapacity(Object.values(report.accounts[accountName] ?? {}), report.retrievedOn);

export const getLocationUsedCapacity = (report: StorageUsageReport, locationName: string): LatestUsedCapacity =>
  toLatestUsedCapacity(
    Object.values(report.accounts).flatMap((locationsUsage) =>
      locationName in locationsUsage ? [locationsUsage[locationName]] : [],
    ),
    report.retrievedOn,
  );

export const getAccountLocationUsedCapacity = (
  report: StorageUsageReport,
  accountName: string,
  locationName: string,
): LatestUsedCapacity | undefined => {
  const bytesUsed = report.accounts[accountName]?.[locationName];
  return bytesUsed === undefined ? undefined : toLatestUsedCapacity([bytesUsed], report.retrievedOn);
};
