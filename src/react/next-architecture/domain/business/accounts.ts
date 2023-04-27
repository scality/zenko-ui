import { useQuery, useQueryClient } from 'react-query';
import { IAccountsAdapter } from '../../adapters/accounts-locations/IAccountsAdapter';
import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import {
  AccountLatestUsedCapacityPromiseResult,
  AccountsPromiseResult,
  Account,
} from '../entities/account';
import { LatestUsedCapacity } from '../entities/metrics';

// Pensieve API return an error with 400 if the number of requested accounts exceed 1000.
const MAX_NUM_ACCOUNT_REQUEST = 1000;

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
    accountsCanonicalIds: string[],
  ) => ({
    queryKey: ['accountsMetrics'],
    queryFn: () =>
      metricsAdapter.listAccountsLatestUsedCapacity(accountsCanonicalIds),
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
 * The hook returns the entire account list and the Storage Metrics ONLY for the first 1000 accounts.
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
    ...queries.listAccountsMetrics(
      metricsAdapter,
      accountInfos
        ?.map((ai) => ai.canonicalId)
        .slice(0, MAX_NUM_ACCOUNT_REQUEST) || [],
    ),
    enabled: !!(accountStatus === 'success' && accountInfos),
  });
  if (
    accountStatus === 'success' &&
    (metricsStatus === 'idle' || metricsStatus === 'loading')
  ) {
    const accounts: Account[] = accountInfos.map((accountInfo) => {
      return {
        ...accountInfo,
        usedCapacity: { status: 'loading' },
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
          : {
              status: 'unknown',
            },
      };
    });
    return { accounts: { status: 'success', value: accounts } };
  } else if (accountStatus === 'success' && metricsStatus === 'error') {
    const accounts: Account[] = accountInfos.map((accountInfo, i) => {
      return {
        ...accountInfo,
        usedCapacity:
          i < MAX_NUM_ACCOUNT_REQUEST
            ? {
                status: 'error',
                title: 'Account metrics error',
                reason: 'An error occurred when fetching metrics',
              }
            : { status: 'unknown' },
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
        reason: 'An error occurred when fetching the metrics',
      },
    };
  } else if (
    status === 'loading' ||
    accountMetricsQueryState?.status === 'loading'
  ) {
    return { usedCapacity: { status: 'loading' } };
  }
  return { usedCapacity: { status: 'loading' } };
};
