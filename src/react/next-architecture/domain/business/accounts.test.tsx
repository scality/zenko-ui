import { renderHook } from '@testing-library/react-hooks';
import { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import {
  ACCOUNT,
  ACCOUNT_CANONICAL_ID,
  ACCOUNT_METRICS,
  MEASURED_ON,
  NEWLY_CREATED_ACCOUNT,
  NEWLY_CREATED_ACCOUNT_METRICS,
} from '../../../../js/mock/managementClientStorageConsumptionMetricsHandlers';
import { prepareRenderMultipleHooks } from '../../../utils/testMultipleHooks';
import { IAccountsAdapter } from '../../adapters/accounts-locations/IAccountsAdapter';
import { MockedAccountsAdapter } from '../../adapters/accounts-locations/MockedAccountsLocationsAdapter';
import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import { MockedMetricsAdapter } from '../../adapters/metrics/MockedMetricsAdapter';
import { AccountInfo } from '../entities/account';
import { LatestUsedCapacity } from '../entities/metrics';
import { useAccountLatestUsedCapacity, useListAccounts } from './accounts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});
afterEach(() => queryClient.clear());
const Wrapper = ({ children }: PropsWithChildren<Record<string, never>>) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
const CREATION_DATE = '2023-03-27T12:58:13.000Z';
const setupListAccountAdaptersForThousandAccounts = () => {
  const accountsAdapter = new MockedAccountsAdapter();
  const metricsAdapter = new MockedMetricsAdapter();
  accountsAdapter.listAccounts = jest
    .fn()
    .mockImplementation(async (): Promise<AccountInfo[]> => {
      return new Array(1001).fill(null).map((_, i) => {
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
    .mockImplementation(
      async (): Promise<Record<string, LatestUsedCapacity>> => {
        const accountsMetrics: Record<string, LatestUsedCapacity> = {};
        for (let i = 0; i < 1000; i++) {
          const accountCanonicalId = `canonicalId-${i}`;
          accountsMetrics[accountCanonicalId] = {
            type: 'hasMetrics',
            usedCapacity: {
              current: 1024,
              nonCurrent: 0,
            },
            measuredOn: new Date(MEASURED_ON),
          };
        }
        return accountsMetrics;
      },
    );
  return { accountsAdapter, metricsAdapter };
};

describe('useListAccounts', () => {
  it('should return accounts as soon as it is resolved', async () => {
    //S
    const accountsAdapter = new MockedAccountsAdapter();
    const metricsAdapter = new MockedMetricsAdapter();
    metricsAdapter.listAccountsLatestUsedCapacity = jest
      .fn()
      .mockImplementation(async () => {
        return new Promise((resolve) =>
          setTimeout(() => {
            resolve([]);
          }, 5000),
        );
      });
    //E
    const { result, waitFor } = renderHook(
      () => useListAccounts({ accountsAdapter, metricsAdapter }),
      { wrapper: Wrapper },
    );
    await waitFor(() => result.current.accounts.status === 'success');
    //V
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: [
        { ...ACCOUNT, ...{ usedCapacity: { status: 'idle' } } },
        { ...NEWLY_CREATED_ACCOUNT, ...{ usedCapacity: { status: 'idle' } } },
      ],
    });
  });
  it('should return accounts and metrics', async () => {
    //S
    const metricsAdapter = new MockedMetricsAdapter();
    const accountsAdapter = new MockedAccountsAdapter();
    //E
    const { result, waitFor } = renderHook(
      () => useListAccounts({ accountsAdapter, metricsAdapter }),
      { wrapper: Wrapper },
    );
    await waitFor(() => result.current.accounts.status === 'success', {
      timeout: 3000,
    });
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
  it('should return accounts and metrics of the first thousand accounts if there is more than one thousand of accounts', async () => {
    //S
    const { accountsAdapter, metricsAdapter } =
      setupListAccountAdaptersForThousandAccounts();
    //E
    const { result, waitFor } = renderHook(
      () => useListAccounts({ accountsAdapter, metricsAdapter }),
      { wrapper: Wrapper },
    );
    await waitFor(() => result.current.accounts.status === 'success', {
      timeout: 3000,
    });
    //V
    const oneThousandAccounts = new Array(1000).fill(null).map((_, i) => {
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
    });
    const account1001 = {
      id: 'id-1000',
      name: 'name-1000',
      canonicalId: `canonicalId-1000`,
      creationDate: new Date(CREATION_DATE),
      usedCapacity: { status: 'idle' },
    };
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: [...oneThousandAccounts, account1001],
    });
  });
  it('should return an error in case of fetching accounts failed', async () => {
    //S
    const accountsAdapter = new MockedAccountsAdapter();
    const metricsAdapter = new MockedMetricsAdapter();
    accountsAdapter.listAccounts = jest.fn().mockImplementation(async () => {
      return Promise.reject('List accounts error');
    });
    //E
    const { result, waitFor } = renderHook(
      () => useListAccounts({ accountsAdapter, metricsAdapter }),
      { wrapper: Wrapper },
    );
    //V
    await waitFor(() => result.current.accounts.status === 'error');
    expect(result.current.accounts).toStrictEqual({
      status: 'error',
      title: 'List accounts error',
      reason: 'An error occurred when fetching accounts',
    });
  });
  it('should return accounts with an error in case of fetching metrics failed', async () => {
    //S
    const accountsAdapter = new MockedAccountsAdapter();
    const metricsAdapter = new MockedMetricsAdapter();
    metricsAdapter.listAccountsLatestUsedCapacity = jest
      .fn()
      .mockImplementation(async () => {
        return Promise.reject('error');
      });
    //E
    const { result, waitFor } = renderHook(
      () => useListAccounts({ accountsAdapter, metricsAdapter }),
      { wrapper: Wrapper },
    );
    await waitFor(() => result.current.accounts.status === 'success');
    //V
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: [
        {
          ...ACCOUNT,
          usedCapacity: {
            status: 'error',
            title: 'Account metrics error',
            reason: 'An error occurred when fetching metrics',
          },
        },
        {
          ...NEWLY_CREATED_ACCOUNT,
          usedCapacity: {
            status: 'error',
            title: 'Account metrics error',
            reason: 'An error occurred when fetching metrics',
          },
        },
      ],
    });
  });
});

// In order to retrieve metrics, the listAccounts should be success
const setUpTest = async ({
  metricsAdapter,
  accountsAdapter,
}: {
  metricsAdapter: IMetricsAdapter;
  accountsAdapter: IAccountsAdapter;
}) => {
  const { renderAdditionalHook } = prepareRenderMultipleHooks({
    wrapper: Wrapper,
  });
  const { waitFor, result: resultAccounts } = renderAdditionalHook(
    'listAccounts',
    () => useListAccounts({ accountsAdapter, metricsAdapter }),
  );
  await waitFor(() => resultAccounts.current.accounts.status === 'success');
  return { renderAdditionalHook, waitFor, resultAccounts };
};

describe('useAccountLatestUsedCapacity', () => {
  it('should return metrics direcly from cache if listAccountMetrics has done', async () => {
    //S
    const accountsAdapter = new MockedAccountsAdapter();
    const metricsAdapter = new MockedMetricsAdapter();
    const { renderAdditionalHook } = await setUpTest({
      metricsAdapter,
      accountsAdapter,
    });
    //E
    const { result, waitFor } = renderAdditionalHook('accountMetrics', () =>
      useAccountLatestUsedCapacity({
        metricsAdapter,
        accountCanonicalId: ACCOUNT_CANONICAL_ID,
      }),
    );
    await waitFor(() => result.current.usedCapacity.status === 'success');
    //V
    expect(result.current.usedCapacity).toStrictEqual({
      status: 'success',
      value: ACCOUNT_METRICS,
    });
  });
  it('should return metrics from react query for the account that has not retrieved metrics', async () => {
    //S
    const CANONICALID_ACCOUNT_MILLE = 'canonicalId-1000';
    const { accountsAdapter, metricsAdapter } =
      setupListAccountAdaptersForThousandAccounts();

    const { renderAdditionalHook, waitFor, resultAccounts } = await setUpTest({
      metricsAdapter,
      accountsAdapter,
    });

    //E
    //Wait for the first 1000 to be ready
    await waitFor(
      () =>
        resultAccounts.current.accounts.value[0].usedCapacity.status ===
        'success',
    );
    //S
    metricsAdapter.listAccountsLatestUsedCapacity = jest
      .fn()
      .mockImplementation(
        async (): Promise<Record<string, LatestUsedCapacity>> => {
          const accountsMetrics: Record<string, LatestUsedCapacity> = {};
          accountsMetrics[CANONICALID_ACCOUNT_MILLE] = {
            type: 'hasMetrics',
            usedCapacity: {
              current: 1024,
              nonCurrent: 0,
            },
            measuredOn: new Date(MEASURED_ON),
          };
          return accountsMetrics;
        },
      );
    //E
    const { result } = renderAdditionalHook('metrics', () =>
      useAccountLatestUsedCapacity({
        metricsAdapter,
        accountCanonicalId: CANONICALID_ACCOUNT_MILLE,
      }),
    );
    await waitFor(() => result.current.usedCapacity.status === 'success');
    //V
    expect(result.current.usedCapacity).toStrictEqual({
      status: 'success',
      value: ACCOUNT_METRICS,
    });
  });
  it('should return error in cause of fetching metrics failed', async () => {
    //S
    const metricsAdapter = new MockedMetricsAdapter();
    const accountsAdapter = new MockedAccountsAdapter();

    metricsAdapter.listAccountsLatestUsedCapacity = jest
      .fn()
      .mockImplementation(async () => Promise.reject('error'));
    const { renderAdditionalHook } = await setUpTest({
      metricsAdapter,
      accountsAdapter,
    });
    //E
    const { result, waitFor } = renderAdditionalHook('metrics', () =>
      useAccountLatestUsedCapacity({
        metricsAdapter,
        accountCanonicalId: ACCOUNT_CANONICAL_ID,
      }),
    );
    await waitFor(() => result.current.usedCapacity.status === 'error');
    //V
    expect(result.current.usedCapacity).toStrictEqual({
      status: 'error',
      title: 'Account metrics error',
      reason: `An error occurred when fetching the metrics for accountCanonicalId:${ACCOUNT_CANONICAL_ID}`,
    });
  });
  it('should return idle status while listAccounts query has not be success', async () => {
    //S
    const accountsAdapter = new MockedAccountsAdapter();
    const metricsAdapter = new MockedMetricsAdapter();
    accountsAdapter.listAccounts = jest.fn().mockImplementation(async () => {
      return new Promise((resolve) =>
        setTimeout(() => {
          resolve([]);
        }, 20000),
      );
    });
    //E
    const { renderAdditionalHook } = prepareRenderMultipleHooks({
      wrapper: Wrapper,
    });
    renderAdditionalHook('listAccounts', () =>
      useListAccounts({
        metricsAdapter,
        accountsAdapter,
      }),
    );
    const { result } = renderAdditionalHook('accountMetrics', () =>
      useAccountLatestUsedCapacity({
        metricsAdapter,
        accountCanonicalId: ACCOUNT_CANONICAL_ID,
      }),
    );
    //V
    expect(result.current.usedCapacity.status).toBe('idle');
  });
});
