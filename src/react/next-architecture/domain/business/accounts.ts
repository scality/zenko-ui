import { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';
import { STORAGE_ACCOUNT_OWNER_ROLE, STORAGE_MANAGER_ROLE, useAuthGroups } from '../../../utils/hooks';
import type { IAccessibleAccounts } from '../../adapters/accessible-accounts/IAccessibleAccounts';
import type { ILocationsEndpointsAdapter } from '../../adapters/accounts-locations/ILocationsEndpointsBundledAdapter';
import type { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import type { Account, AccountsPromiseResult } from '../entities/account';
import type { StorageUsageReport } from '../entities/metrics';
import { getAccountUsedCapacity, useStorageUsageReport } from './storageUsageReport';

const noRefetchOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};

export const queries = {
  listLocationsAndEndpoints: (locationsEndpointsAdapter: ILocationsEndpointsAdapter) => ({
    queryKey: ['locationsEndpoints'],
    queryFn: () => locationsEndpointsAdapter.listLocationsAndEndpoints(),
    ...noRefetchOptions,
  }),
};

export const useLocationsAndEndpoints = ({
  locationsEndpointsAdapter,
}: {
  locationsEndpointsAdapter: ILocationsEndpointsAdapter;
}) => {
  const {
    data: locationsAndEndpoints,
    refetch: refetchLocationsEndpoints,
    ...result
  } = useQuery(queries.listLocationsAndEndpoints(locationsEndpointsAdapter));

  const refetchLocationsEndpointsMutation = useMutation({
    mutationFn: async () => {
      return refetchLocationsEndpoints().then(({ data, status, error }) => {
        if (status === 'error') {
          throw error;
        }
        return data;
      });
    },
  });

  return {
    locationsAndEndpoints,
    refetchLocationsEndpoints,
    refetchLocationsEndpointsMutation,
    ...result,
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
  reportStatus: string,
  report: StorageUsageReport | undefined,
  accountName: string,
): Account['usedCapacity'] => {
  if (report) {
    return { status: 'success', value: getAccountUsedCapacity(report, accountName) };
  }
  if (reportStatus === 'error') {
    return {
      status: 'error',
      title: 'Account metrics error',
      reason: 'An error occurred when fetching metrics',
    };
  }
  return { status: 'loading' };
};

export const useListAccounts = ({
  accessibleAccountsAdapter,
  metricsAdapter,
}: {
  accessibleAccountsAdapter: IAccessibleAccounts;
  metricsAdapter: IMetricsAdapter;
}): AccountsPromiseResult => {
  const { accountInfos } = accessibleAccountsAdapter.useListAccessibleAccounts();
  const { isStorageManager, isStorageUsageReporter } = useAuthGroups();
  const { data: report, status: reportStatus } = useStorageUsageReport({
    metricsAdapter,
    enabled:
      accountInfos.status === 'success' &&
      accountInfos.value.length > 0 &&
      (isStorageManager || isStorageUsageReporter),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountInfos.status, accountInfos.status === 'success' ? accountInfos.value : undefined]);

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
    usedCapacity: resolveUsedCapacity(reportStatus, report, accountInfo.name),
  }));
  return { accounts: { status: 'success', value: accounts } };
};
