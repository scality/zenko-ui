import { useQuery, useQueryClient } from 'react-query';
import { IAccountsAdapter } from '../../adapters/accounts-locations/IAccountsAdapter';
import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import {
  AccountLatestUsedCapacityPromiseResult,
  AccountsPromiseResult,
  Account,
  AccountInfo,
} from '../entities/account';
import { LatestUsedCapacity } from '../entities/metrics';

const getFirst1000AccountCanonicalIds = (
  accountInfos: AccountInfo[],
): string[] => {
  const accountsCanonicalIds = accountInfos.map(
    (accountInfo) => accountInfo.canonicalId,
  );
  if (accountsCanonicalIds.length <= 1000) {
    return accountsCanonicalIds;
  } else {
    return accountsCanonicalIds.slice(0, 999);
  }
};

const noRefetchOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};

const queries = {
  listAccounts: (accountsAdapter: IAccountsAdapter) => ({
    queryKey: ['accounts'],
    queryFn: accountsAdapter.listAccounts,
    ...noRefetchOptions,
  }),
  listAccountsMetrics: (
    metricsAdapter: IMetricsAdapter,
    accountInfos: AccountInfo[],
  ) => ({
    queryKey: ['accountsMetrics'],
    queryFn: () =>
      metricsAdapter.listAccountsLatestUsedCapacity(
        getFirst1000AccountCanonicalIds(accountInfos),
      ),
    ...noRefetchOptions,
  }),
  getMetricsForAnAccount: (
    metricsAdapter: IMetricsAdapter,
    accountCanonicalId: string,
  ) => ({
    queryKey: ['accountMetrics', accountCanonicalId],
    queryFn: () =>
      metricsAdapter.listAccountsLatestUsedCapacity([accountCanonicalId]),
    ...noRefetchOptions,
  }),
};

/**
 * The hook returns the entire account list and the storage metric for the first one thousand of accounts.
 * @param metricsAdapter
 * @param accountsAdapter
 */
export const useListAccounts = ({
  accountsAdapter,
  metricsAdapter,
}: {
  accountsAdapter: IAccountsAdapter;
  metricsAdapter: IMetricsAdapter;
}): AccountsPromiseResult => {
  const { data: accountInfos, status: accountStatus } = useQuery(
    queries.listAccounts(accountsAdapter),
  );
  const { data: metrics, status: metricsStatus } = useQuery({
    //@ts-expect-error once the query is triggered the accontInfos can't be undefined
    ...queries.listAccountsMetrics(metricsAdapter, accountInfos),
    ...{ enabled: accountStatus === 'success' },
  });
  if (
    accountStatus === 'success' &&
    (metricsStatus === 'idle' || metricsStatus === 'loading')
  ) {
    const accounts: Account[] = accountInfos.map((accountInfo) => {
      return {
        ...accountInfo,
        usedCapacity: { status: 'idle' },
      };
    });
    return { accounts: { status: 'success', value: accounts } };
  } else if (accountStatus === 'success' && metricsStatus === 'success') {
    const accounts: Account[] = accountInfos.map((accountInfo) => {
      const accountCanonicalId = accountInfo.canonicalId;
      return {
        ...accountInfo,
        usedCapacity: metrics[accountCanonicalId]
          ? {
              status: 'success',
              value: metrics[accountCanonicalId],
            }
          : { status: 'idle' },
      };
    });
    return { accounts: { status: 'success', value: accounts } };
  } else if (accountStatus === 'success' && metricsStatus === 'error') {
    const accounts: Account[] = accountInfos.map((accountInfo) => {
      return {
        ...accountInfo,
        usedCapacity: {
          status: 'error',
          title: 'Account metrics error',
          reason: 'An error occurred when fetching metrics',
        },
      };
    });
    return { accounts: { status: 'success', value: accounts } };
  } else if (accountStatus === 'error') {
    return {
      accounts: {
        status: 'error',
        title: 'List accounts error',
        reason: 'An error occurred when fetching accounts',
      },
    };
  }
  return { accounts: { status: 'loading' } };
};

/**
 * The hook returns the latest used capacity for a specific account, calling it in the Account Table Data Used Cell.
 * It will be enabled after retrieving the accounts and will update the cache of account-metrics.
 * @param metricsAdapter
 * @param accountCanonicalId
 */
export const useAccountLatestUsedCapacity = ({
  metricsAdapter,
  accountCanonicalId,
}: {
  metricsAdapter: IMetricsAdapter;
  accountCanonicalId: string;
}): AccountLatestUsedCapacityPromiseResult => {
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryData<
    Record<string, LatestUsedCapacity>
  >(['accountsMetrics']);
  const isAccountCanonicalIdMetricsCacheExist =
    queryCache && queryCache[accountCanonicalId];
  const accountMetricsQueryState = queryClient.getQueryState([
    'accountsMetrics',
  ]);
  const queryAccountsStatus = queryClient.getQueryState(['accounts']);
  const { data, status } = useQuery({
    ...queries.getMetricsForAnAccount(metricsAdapter, accountCanonicalId),
    enabled:
      queryAccountsStatus?.status === 'success' &&
      !isAccountCanonicalIdMetricsCacheExist,
  });
  // if the metrics cache for a specific account exist, directly return the value.
  if (isAccountCanonicalIdMetricsCacheExist) {
    return {
      usedCapacity: {
        status: 'success',
        value: queryCache[accountCanonicalId],
      },
    };
  } else if (status === 'success') {
    return {
      usedCapacity: {
        status: 'success',
        value: data[accountCanonicalId],
      },
    };
  } else if (status === 'error') {
    return {
      usedCapacity: {
        status: 'error',
        title: 'Account metrics error',
        reason: `An error occurred when fetching the metrics for accountCanonicalId:${accountCanonicalId}`,
      },
    };
  } else if (
    status === 'loading' ||
    accountMetricsQueryState?.status === 'loading'
  ) {
    return { usedCapacity: { status: 'loading' } };
  } else {
    return { usedCapacity: { status: 'idle' } };
  }
};
