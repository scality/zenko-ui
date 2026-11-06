import type { StorageUsageReport } from '../entities/metrics';
import { getAccountLocationUsedCapacity, getAccountUsedCapacity, getLocationUsedCapacity } from './storageUsageReport';

const retrievedOn = new Date('2026-01-01T00:00:00Z');

const hasMetrics = (current: number) => ({
  type: 'hasMetrics',
  usedCapacity: { current, nonCurrent: 0 },
  measuredOn: retrievedOn,
});

describe('storage usage report', () => {
  const report: StorageUsageReport = {
    accounts: { 'account-a': { 'us-east-1': 1024 } },
    retrievedOn,
  };

  it.each(['constructor', 'toString', 'hasOwnProperty'])('should not read the inherited %s key as usage', (name) => {
    expect(getAccountUsedCapacity(report, name)).toEqual({ type: 'noMetrics' });
    expect(getLocationUsedCapacity(report, name)).toEqual({ type: 'noMetrics' });
    expect(getAccountLocationUsedCapacity(report, 'account-a', name)).toBeUndefined();
  });

  it('should read an account or a location actually named constructor', () => {
    const reportWithConstructorNames: StorageUsageReport = {
      accounts: {
        constructor: { 'us-east-1': 1 },
        'account-a': { constructor: 1024 },
        'account-b': { constructor: 2048 },
      },
      retrievedOn,
    };

    expect(getAccountUsedCapacity(reportWithConstructorNames, 'constructor')).toEqual(hasMetrics(1));
    expect(getLocationUsedCapacity(reportWithConstructorNames, 'constructor')).toEqual(hasMetrics(3072));
    expect(getAccountLocationUsedCapacity(reportWithConstructorNames, 'account-b', 'constructor')).toEqual(
      hasMetrics(2048),
    );
  });
});
