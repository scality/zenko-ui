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
import { PromiseResult } from '../entities/promise';

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
    queryFn: () => accountsAdapter.listAccounts(),
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

export const useAccountCannonicalId = ({
  accountsAdapter,
  accountId,
}: {
  accountsAdapter: IAccountsAdapter;
  accountId: string;
}): PromiseResult<string> => {
  const { data: accountInfos, status: accountStatus } = useQuery(
    queries.listAccounts(accountsAdapter),
  );

  if (accountStatus === 'loading' || accountStatus === 'idle') {
    return {
      status: 'loading',
    };
  }

  if (accountStatus === 'error') {
    return {
      status: accountStatus,
      title: 'Account Error',
      reason: `Unexpected error while fetching account`,
    };
  }

  const account = accountInfos?.find((a) => a.id === accountId);
  if (!account) {
    return {
      status: 'error',
      title: 'Account Not Found Error',
      reason: `Account ${accountId} not found`,
    };
  }

  return {
    status: 'success',
    value: account.canonicalId,
  };
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
    enabled:
      !!(accountInfos.status === 'success') && accountInfos.value.length > 0,
  });

  const accountInfosWithPerferredAssumableRole = useMemo(() => {
    if (accountInfos.status === 'success') {
      const accounts = accountInfos.value.map((accountInfo) => {
        const roleStorageAccountOwner = accountInfo.assumableRoles.find(
          (role) => role.Name === STORAGE_ACCOUNT_OWNER_ROLE,
        );
        const roleStorageManager = accountInfo.assumableRoles.find(
          (role) => role.Name === STORAGE_MANAGER_ROLE,
        );
        let preferredAssumableRoleArn = accountInfo.assumableRoles[0].Arn;
        if (roleStorageAccountOwner) {
          preferredAssumableRoleArn = roleStorageAccountOwner.Arn;
        } else if (roleStorageManager) {
          preferredAssumableRoleArn = roleStorageManager.Arn;
        }
        return {
          ...accountInfo,
          preferredAssumableRoleArn,
          canManageAccount: !!roleStorageAccountOwner || !!roleStorageManager,
        };
      });
      return accounts;
    }
    return [];
  }, [accountInfos.status]);

  if (
    accountInfos.status === 'success' &&
    (metricsStatus === 'idle' || metricsStatus === 'loading')
  ) {
    const accounts: Account[] = accountInfosWithPerferredAssumableRole.map(
      (accountInfo) => {
        return {
          ...accountInfo,
          usedCapacity: { status: 'loading' },
        };
      },
    );
    return { accounts: { status: 'success', value: accounts } };
  } else if (accountInfos.status === 'success' && metricsStatus === 'success') {
    const accounts: Account[] = accountInfosWithPerferredAssumableRole.map(
      (accountInfo) => {
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
      },
    );
    return { accounts: { status: 'success', value: accounts } };
  } else if (accountInfos.status === 'success' && metricsStatus === 'error') {
    const accounts: Account[] = accountInfosWithPerferredAssumableRole.map(
      (accountInfo, i) => {
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
      },
    );
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
  metricsAdapter,
  accountCanonicalId,
}: {
  metricsAdapter: IMetricsAdapter;
  accountCanonicalId: string;
}): AccountLatestUsedCapacityPromiseResult => {
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryState<
    Record<string, LatestUsedCapacity>
  >(['accountsMetrics']);
  const isAccountCanonicalIdMetricsCacheExist =
    queryCache?.data && queryCache?.data[accountCanonicalId];
  const accountMetricsQueryState = queryClient.getQueryState([
    'accountsMetrics',
  ]);
  const { data, status } = useQuery({
    ...queries.getMetricsForAnAccount(metricsAdapter, accountCanonicalId),
    enabled:
      (queryCache?.status === 'success' || queryCache?.status === 'error') &&
      !isAccountCanonicalIdMetricsCacheExist,
  });
  // if the metrics cache for a specific account exist, directly return the value.
  if (isAccountCanonicalIdMetricsCacheExist) {
    return {
      usedCapacity: {
        status: 'success',
        //@ts-expect-error queryCache.data can't be undefined here
        value: queryCache.data[accountCanonicalId],
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
