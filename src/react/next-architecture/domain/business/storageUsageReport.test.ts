import { act, renderHook } from '@testing-library/react-hooks';
import { NewWrapper, queryClient } from '../../../utils/testUtil';
import { MockedMetricsAdapter } from '../../adapters/metrics/MockedMetricsAdapter';
import type { StorageUsageReport } from '../entities/metrics';
import {
  getAccountLocationUsedCapacity,
  getAccountUsedCapacity,
  getLocationUsedCapacity,
  useStorageUsageReport,
} from './storageUsageReport';

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

describe('useStorageUsageReport', () => {
  beforeEach(() => queryClient.clear());

  it('should keep an account named __proto__ when a refetch changes the report', async () => {
    //S
    const reportWithAccountABytes = (bytes: number): StorageUsageReport => ({
      accounts: JSON.parse(`{"__proto__":{"us-east-1":100},"account-a":{"us-east-1":${bytes}}}`),
      retrievedOn,
    });
    const metricsAdapter = new MockedMetricsAdapter();
    metricsAdapter.getStorageUsageReport = jest
      .fn()
      .mockResolvedValueOnce(reportWithAccountABytes(1))
      .mockResolvedValueOnce(reportWithAccountABytes(2));
    const { result, waitFor } = renderHook(() => useStorageUsageReport({ metricsAdapter, enabled: true }), {
      wrapper: NewWrapper(),
    });
    await waitFor(() => result.current.isSuccess);

    //E
    await act(async () => {
      await result.current.refetch();
    });

    //V
    const report = result.current.data;
    if (!report) {
      throw new Error('expected the storage usage report to be loaded');
    }
    expect(getAccountUsedCapacity(report, 'account-a')).toEqual(hasMetrics(2));
    expect(Object.keys(report.accounts)).toEqual(['__proto__', 'account-a']);
    expect(getAccountUsedCapacity(report, '__proto__')).toEqual(hasMetrics(100));
  });
});
