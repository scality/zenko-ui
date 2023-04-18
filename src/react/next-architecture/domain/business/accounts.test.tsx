import { renderHook } from '@testing-library/react-hooks';
import {
  ACCOUNT,
  ACCOUNT_CANONICAL_ID,
  ACCOUNT_METRICS,
  MEASURED_ON,
  NEWLY_CREATED_ACCOUNT,
  NEWLY_CREATED_ACCOUNT_METRICS,
} from '../../../../js/mock/managementClientStorageConsumptionMetricsHandlers';
import { MockedAccountsAdapter } from '../../adapters/accounts-locations/MockedAccountsLocationsAdapter';
import { AccountLatestUsedCapacity } from '../../adapters/metrics/IMetricsAdapter';
import { MockedMetricsAdapter } from '../../adapters/metrics/MockedMetricsAdapter';
import { Account, AccountInfo } from '../entities/account';
import { useAccountLatestUsedCapacity, useListAccounts } from './accounts';

const wrapper = () => {
  return <></>;
};
describe.skip('useListAccounts', () => {
  it('should return accounts as soon as it is resolved', () => {
    //S
    const accountsAdapter = new MockedAccountsAdapter();
    const metricsAdapter = new MockedMetricsAdapter();
    metricsAdapter.listAccountsLatestUsedCapacity = jest
      .fn()
      .mockImplementation(async () => {
        setTimeout(() => {
          return [];
        }, 5000);
      });
    //E
    const { result } = renderHook(
      () => useListAccounts({ accountsAdapter, metricsAdapter }),
      { wrapper },
    );
    //V
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: [ACCOUNT, NEWLY_CREATED_ACCOUNT],
    });
  });

  it('should return accounts and metrics', () => {
    //S
    const metricsAdapter = new MockedMetricsAdapter();
    const accountsAdapter = new MockedAccountsAdapter();
    //E
    const { result } = renderHook(
      () => useListAccounts({ accountsAdapter, metricsAdapter }),
      { wrapper },
    );
    //V
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: [
        {
          ...ACCOUNT,
          usedCapacity: { status: 'success', value: ACCOUNT_METRICS },
        },
        {
          ...NEWLY_CREATED_ACCOUNT,
          usedCapacity: {
            status: 'success',
            value: NEWLY_CREATED_ACCOUNT_METRICS,
          },
        },
      ],
    });
  });
  it('should return accounts and metrics of the first 1000 accounts if there is more than 1000 accounts', () => {
    //S
    const CREATION_DATE = '2023-03-27T12:58:13.000Z';
    const accountsAdapter = new MockedAccountsAdapter();
    const metricsAdapter = new MockedMetricsAdapter();
    accountsAdapter.listAccounts = jest
      .fn()
      .mockImplementation(async (): Promise<AccountInfo[]> => {
        return new Array(1001).map((_, i) => {
          return {
            id: `id-${i}`,
            name: `name-${i}`,
            canonicalId: `canonicalId-${i}`,
            creationDate: new Date(CREATION_DATE),
          };
        });
      });
    metricsAdapter.listAccountsLatestUsedCapacity = jest
      .fn()
      .mockImplementation(async (): Promise<AccountLatestUsedCapacity[]> => {
        return new Array(1000).map((_, i) => {
          return {
            accountCanonicalId: `canonicalId-${i}`,
            type: 'hasMetrics',
            usedCapacity: {
              current: 1024,
              nonCurrent: 0,
            },
            measuredOn: new Date(MEASURED_ON),
          };
        });
      });
    //E
    const { result } = renderHook(
      () => useListAccounts({ accountsAdapter, metricsAdapter }),
      { wrapper },
    );
    //V
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: new Array(1000).map((_, i) => {
        return {
          id: `id-${i}`,
          name: `name-${i}`,
          canonicalId: `canonicalId-${i}`,
          creationDate: new Date(CREATION_DATE),
          usedCapacity: {
            status: 'success',
            value: {
              type: 'hasMetrics',
              usedCapacity: {
                current: 1024,
                nonCurrent: 0,
              },
              measuredOn: new Date(MEASURED_ON),
            },
          },
        };
      }),
    });
  });
  it('should return an error in case of fetching accounts failed', () => {
    //S
    const accountsAdapter = new MockedAccountsAdapter();
    const metricsAdapter = new MockedMetricsAdapter();
    accountsAdapter.listAccounts = jest.fn().mockImplementation(async () => {
      return Promise.reject('error');
    });
    //E
    const { result } = renderHook(
      () => useListAccounts({ accountsAdapter, metricsAdapter }),
      { wrapper },
    );
    //V
    expect(result.current.accounts).toStrictEqual({
      status: 'error',
      title: 'An error occurred when fetching accounts',
      reason: 'error',
    });
  });
  it('should return accounts with an error in case of fetching metrics failed', () => {
    //S
    const accountsAdapter = new MockedAccountsAdapter();
    const metricsAdapter = new MockedMetricsAdapter();
    metricsAdapter.listAccountsLatestUsedCapacity = jest
      .fn()
      .mockImplementation(async () => {
        return Promise.reject('error');
      });
    //E
    const { result } = renderHook(
      () => useListAccounts({ accountsAdapter, metricsAdapter }),
      { wrapper },
    );
    //V
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: [
        {
          ...ACCOUNT,
          usedCapacity: {
            status: 'error',
            title: 'An error occurred when fetching metrics',
            reason: 'error',
          },
        },
        {
          ...NEWLY_CREATED_ACCOUNT,
          usedCapacity: {
            status: 'error',
            title: 'An error occurred when fetching metrics',
            reason: 'error',
          },
        },
      ],
    });
  });
});

describe.skip('useAccountLatestUsedCapacity', () => {
  it('should return the metrics for an account', () => {
    //S
    const metricsAdapter = new MockedMetricsAdapter();
    //E
    const { result } = renderHook(
      () =>
        useAccountLatestUsedCapacity({
          metricsAdapter,
          accountCanonicalId: ACCOUNT_CANONICAL_ID,
        }),
      {
        wrapper,
      },
    );
    //V
    expect(result.current.usedCapacity).toStrictEqual({
      status: 'success',
      value: ACCOUNT_METRICS,
    });
  });
  it('should return error in cause of fetching metrics failed', () => {
    //S
    const metricsAdapter = new MockedMetricsAdapter();
    metricsAdapter.listAccountsLatestUsedCapacity = jest
      .fn()
      .mockImplementation(async () => Promise.reject('error'));
    //E
    const { result } = renderHook(
      () =>
        useAccountLatestUsedCapacity({
          metricsAdapter,
          accountCanonicalId: ACCOUNT_CANONICAL_ID,
        }),
      {
        wrapper,
      },
    );
    //V
    expect(result.current.usedCapacity).toStrictEqual({
      status: 'error',
      title: 'An error occurred when fetching the metrics',
      reason: 'error',
    });
  });
  it('should not be executed if the account metrics has been retrieved', async () => {
    //S
    const metricsAdapter = new MockedMetricsAdapter();
    const accountsAdapter = new MockedAccountsAdapter();
    //E
    const { result: resultAccounts, waitFor } = renderHook(
      () =>
        useListAccounts({
          metricsAdapter,
          accountsAdapter,
        }),
      {
        wrapper,
      },
    );
    await waitFor(() => resultAccounts.current.accounts.status === 'success');
    const { result } = renderHook(
      () =>
        useAccountLatestUsedCapacity({
          metricsAdapter,
          accountCanonicalId: ACCOUNT_CANONICAL_ID,
        }),
      {
        wrapper,
      },
    );
    //V
    expect(result.current.usedCapacity.status).toBe('idle');
  });
  it('should update the account `usedcapacity` after retrieving the account metrics', async () => {
    //S
    const metricsAdapter = new MockedMetricsAdapter();
    const accountsAdapter = new MockedAccountsAdapter();
    //E
    const { result: resultMetrics, waitFor } = renderHook(
      () =>
        useAccountLatestUsedCapacity({
          metricsAdapter,
          accountCanonicalId: ACCOUNT_CANONICAL_ID,
        }),
      {
        wrapper,
      },
    );
    await waitFor(
      () => resultMetrics.current.usedCapacity.status === 'success',
    );
    const { result, waitFor: waitForMetrics } = renderHook(() =>
      useListAccounts({ accountsAdapter, metricsAdapter }),
    );
    //V
    await waitForMetrics(() => result.current.accounts.status === 'success');

    expect(
      //@ts-ignore
      result.current.accounts.value(
        (account: Account) => account.canonicalId === ACCOUNT_CANONICAL_ID,
      ).usedCapacity.status,
    ).toBe('idle');
  });
});
