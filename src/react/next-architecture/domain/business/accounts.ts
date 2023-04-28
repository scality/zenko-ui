import { useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import {
  STORAGE_ACCOUNT_OWNER_ROLE,
  STORAGE_MANAGER_ROLE,
} from '../../../utils/hooks';
import { IAccessibleAccounts } from '../../adapters/accessible-accounts/IAccessibleAccounts';
import { IAccountsAdapter } from '../../adapters/accounts-locations/IAccountsAdapter';
import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import {
  AccountLatestUsedCapacityPromiseResult,
  AccountsPromiseResult,
  Account,
  AccountInfo,
} from '../entities/account';
import { LatestUsedCapacity } from '../entities/metrics';

// Pensieve API return an error with 400 if the number of requested accounts exceed 1000.
const MAX_NUM_ACCOUNT_REQUEST = 1000;

const noRefetchOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};

export const queries = {
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
 * @param accessibleAccountsAdapter
 */
export const useListAccounts = ({
  accessibleAccountsAdapter,
  metricsAdapter,
}: {
  accessibleAccountsAdapter: IAccessibleAccounts;
  metricsAdapter: IMetricsAdapter;
}): AccountsPromiseResult => {
  const { accountInfos } =
    accessibleAccountsAdapter.useListAccessibleAccounts();
  const { data: metrics, status: metricsStatus } = useQuery({
    ...queries.listAccountsMetrics(
      metricsAdapter,
      accountInfos.status === 'success'
        ? accountInfos.value
            ?.map((ai: AccountInfo) => ai.canonicalId)
            .slice(0, MAX_NUM_ACCOUNT_REQUEST)
        : [],
    ),
    enabled: !!(accountInfos.status === 'success' && accountInfos),
  });

  const accountInfosWithPerferredAssumableRole = useMemo(() => {
    if (accountInfos.status === 'success') {
      const accounts: AccountInfo[] = accountInfos.value.map((accountInfo) => {
        const roleStorageAccountOwner = accountInfo.assumableRoles.find(
          (role) => role.Name === STORAGE_ACCOUNT_OWNER_ROLE,
        );
        const roleStorageManager = accountInfo.assumableRoles.find(
          (role) => role.Name === STORAGE_MANAGER_ROLE,
        );
        let preferredAssumableRole = accountInfo.assumableRoles[0].Arn;
        if (roleStorageAccountOwner) {
          preferredAssumableRole = roleStorageAccountOwner.Arn;
        } else if (roleStorageManager) {
          preferredAssumableRole = roleStorageManager.Arn;
        }
        return {
          ...accountInfo,
          preferredAssumableRole,
        };
      });
      return { accounts: { status: 'success', value: accounts } };
    }
  }, [accountInfos.status]);

  if (
    accountInfos.status === 'success' &&
    (metricsStatus === 'idle' || metricsStatus === 'loading')
  ) {
    const accounts: Account[] = accountInfos.value.map((accountInfo) => {
      return {
        ...accountInfo,
        usedCapacity: { status: 'loading' },
      };
    });
    return { accounts: { status: 'success', value: accounts } };
  } else if (accountInfos.status === 'success' && metricsStatus === 'success') {
    const accounts: Account[] = accountInfos.value.map((accountInfo) => {
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
  } else if (accountInfos.status === 'success' && metricsStatus === 'error') {
    const accounts: Account[] = accountInfos.value.map((accountInfo, i) => {
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
  } else if (accountInfos.status === 'error') {
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
  accessibleAccountsAdapter,
  metricsAdapter,
  accountCanonicalId,
}: {
  accessibleAccountsAdapter: IAccessibleAccounts;
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
  const { accounts } = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });
  const { data, status } = useQuery({
    ...queries.getMetricsForAnAccount(metricsAdapter, accountCanonicalId),
    enabled:
      accounts?.status === 'success' && !isAccountCanonicalIdMetricsCacheExist,
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
