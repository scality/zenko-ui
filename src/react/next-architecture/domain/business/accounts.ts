import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { STORAGE_ACCOUNT_OWNER_ROLE, STORAGE_MANAGER_ROLE, useAuthGroups } from '../../../utils/hooks';
import type { IAccessibleAccounts } from '../../adapters/accessible-accounts/IAccessibleAccounts';
import type { IAccountsLocationsEndpointsAdapter } from '../../adapters/accounts-locations/IAccountsLocationsEndpointsBundledAdapter';
import type { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import type {
  Account,
  AccountInfo,
  AccountLatestUsedCapacityPromiseResult,
  AccountsPromiseResult,
} from '../entities/account';
import type { LatestUsedCapacity } from '../entities/metrics';
import type { PromiseResult } from '../entities/promise';

const noRefetchOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};

export const queries = {
  listAccountsLocationAndEndpoints: (accountsLocationsEndpointsAdapter: IAccountsLocationsEndpointsAdapter) => ({
    queryKey: ['configOverlay'],
    queryFn: () => accountsLocationsEndpointsAdapter.listAccountsLocationsAndEndpoints(),
    ...noRefetchOptions,
  }),
  listAccountsMetrics: (metricsAdapter: IMetricsAdapter, accountsCanonicalIds: string[]) => ({
    queryKey: ['accountsMetrics'],
    queryFn: () => metricsAdapter.listAccountsLatestUsedCapacity(accountsCanonicalIds),
    ...noRefetchOptions,
  }),
  getMetricsForAnAccount: (metricsAdapter: IMetricsAdapter, accountCanonicalId: string) => ({
    queryKey: ['accountMetrics', accountCanonicalId],
    queryFn: () => metricsAdapter.listAccountsLatestUsedCapacity([accountCanonicalId]),
    ...noRefetchOptions,
  }),
};

export const useAccountsLocationsAndEndpoints = ({
  accountsLocationsEndpointsAdapter,
}: {
  accountsLocationsEndpointsAdapter: IAccountsLocationsEndpointsAdapter;
}) => {
  const {
    data: accountsLocationsAndEndpoints,
    refetch: refetchAccountsLocationsEndpoints,
    ...result
  } = useQuery(queries.listAccountsLocationAndEndpoints(accountsLocationsEndpointsAdapter));

  const refetchAccountsLocationsEndpointsMutation = useMutation({
    mutationFn: async () => {
      return refetchAccountsLocationsEndpoints().then(({ data, status, error }) => {
        if (status === 'error') {
          throw error;
        }
        return data;
      });
    },
  });

  return {
    accountsLocationsAndEndpoints,
    refetchAccountsLocationsEndpoints,
    refetchAccountsLocationsEndpointsMutation,
    ...result,
  };
};

export const useAccountCannonicalId = ({
  accountsLocationsEndpointsAdapter,
  accountId,
}: {
  accountsLocationsEndpointsAdapter: IAccountsLocationsEndpointsAdapter;
  accountId: string;
}): PromiseResult<string> => {
  const { accountsLocationsAndEndpoints, status } = useAccountsLocationsAndEndpoints({
    accountsLocationsEndpointsAdapter,
  });

  if (status === 'loading' || status === 'idle') {
    return { status: 'loading' };
  }

  if (status === 'error') {
    return {
      status: 'error',
      title: 'Account Error',
      reason: 'Unexpected error while fetching account',
    };
  }

  const account = accountsLocationsAndEndpoints?.accounts?.find((a) => a.id === accountId);
  if (!account) {
    return { status: 'unknown' };
  }

  return {
    status: 'success',
    value: account.canonicalId,
  };
};

const resolvePreferredRoleArn = (assumableRoles: { Name: string; Arn: string }[]): string => {
  const roleStorageAccountOwner = assumableRoles.find((role) => role.Name === STORAGE_ACCOUNT_OWNER_ROLE);
  if (roleStorageAccountOwner) {
    return roleStorageAccountOwner.Arn;
  }
  const roleStorageManager = assumableRoles.find((role) => role.Name === STORAGE_MANAGER_ROLE);
  if (roleStorageManager) {
    return roleStorageManager.Arn;
  }
  return assumableRoles[0].Arn;
};

const resolveUsedCapacity = (
  metricsStatus: string,
  metrics: Record<string, LatestUsedCapacity> | undefined,
  canonicalId: string,
): Account['usedCapacity'] => {
  if (metricsStatus === 'idle' || metricsStatus === 'loading') {
    return { status: 'loading' };
  }
  if (metricsStatus === 'error') {
    return {
      status: 'error',
      title: 'Account metrics error',
      reason: 'An error occurred when fetching metrics',
    };
  }
  if (metrics?.[canonicalId]) {
    return { status: 'success', value: metrics[canonicalId] };
  }
  return { status: 'unknown' };
};

export const useListAccounts = ({
  accessibleAccountsAdapter,
  metricsAdapter,
}: {
  accessibleAccountsAdapter: IAccessibleAccounts;
  metricsAdapter: IMetricsAdapter;
}): AccountsPromiseResult => {
  const { accountInfos } = accessibleAccountsAdapter.useListAccessibleAccounts();
  const { isStorageManager } = useAuthGroups();

  const { data: metrics, status: metricsStatus } = useQuery({
    ...queries.listAccountsMetrics(
      metricsAdapter,
      accountInfos.status === 'success' ? accountInfos.value?.map((ai: AccountInfo) => ai.canonicalId) : [],
    ),
    enabled: !!(accountInfos.status === 'success') && accountInfos.value.length > 0 && isStorageManager,
  });

  const accountInfosWithPreferredAssumableRole = useMemo(() => {
    if (accountInfos.status !== 'success') {
      return [];
    }
    return accountInfos.value.map((accountInfo) => ({
      ...accountInfo,
      preferredAssumableRoleArn: resolvePreferredRoleArn(accountInfo.assumableRoles),
      canManageAccount:
        !!accountInfo.assumableRoles.find((role) => role.Name === STORAGE_ACCOUNT_OWNER_ROLE) ||
        !!accountInfo.assumableRoles.find((role) => role.Name === STORAGE_MANAGER_ROLE),
    }));
  }, [accountInfos.status]);

  if (accountInfos.status === 'error') {
    return {
      accounts: {
        status: 'error',
        title: 'List accounts error',
        reason: 'An error occurred when fetching accounts',
      },
    };
  }

  if (accountInfos.status !== 'success') {
    return { accounts: { status: 'loading' } };
  }

  const accounts: Account[] = accountInfosWithPreferredAssumableRole.map((accountInfo) => ({
    ...accountInfo,
    usedCapacity: resolveUsedCapacity(metricsStatus, metrics, accountInfo.canonicalId),
  }));
  return { accounts: { status: 'success', value: accounts } };
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
  const queryCache = queryClient.getQueryState<Record<string, LatestUsedCapacity>>(['accountsMetrics']);
  const isAccountCanonicalIdMetricsCacheExist = queryCache?.data && queryCache?.data[accountCanonicalId];
  const accountMetricsQueryState = queryClient.getQueryState(['accountsMetrics']);
  const { isStorageManager } = useAuthGroups();
  const { data, status } = useQuery({
    ...queries.getMetricsForAnAccount(metricsAdapter, accountCanonicalId),
    enabled:
      (queryCache?.status === 'success' || queryCache?.status === 'error') &&
      !isAccountCanonicalIdMetricsCacheExist &&
      isStorageManager,
  });

  if (isAccountCanonicalIdMetricsCacheExist) {
    return {
      usedCapacity: {
        status: 'success',
        value: queryCache.data[accountCanonicalId],
      },
    };
  }

  if (status === 'success') {
    return {
      usedCapacity: {
        status: 'success',
        value: data[accountCanonicalId],
      },
    };
  }

  if (status === 'error') {
    return {
      usedCapacity: {
        status: 'error',
        title: 'Account metrics error',
        reason: 'An error occurred when fetching the metrics',
      },
    };
  }

  if (status === 'loading' || accountMetricsQueryState?.status === 'loading') {
    return { usedCapacity: { status: 'loading' } };
  }

  return { usedCapacity: { status: 'loading' } };
};
