import { act, renderHook } from '@testing-library/react-hooks';
import {
  ACCOUNT_METRICS,
  ACCOUNT_NAME,
  MEASURED_ON,
  NEWLY_CREATED_ACCOUNT_METRICS,
} from '../../../../js/mock/managementClientMSWHandlers';
import { STORAGE_ACCOUNT_OWNER_ROLE } from '../../../utils/hooks';
import { mockUserGroups, NewWrapper, queryClient, resetUserGroups } from '../../../utils/testUtil';
import {
  ACCESSIBLE_ACCOUNTS_EXAMPLE,
  DEFAULT_ASSUMABLE_ROLES,
  DEFAULT_ASSUMABLE_ROLES_ARN,
  MockedAccessibleAccounts,
} from '../../adapters/accessible-accounts/MockedAccessibleAccounts';
import { MockedMetricsAdapter } from '../../adapters/metrics/MockedMetricsAdapter';
import type { AccountInfo } from '../entities/account';
import type { StorageUsageReport } from '../entities/metrics';
import type { PromiseResult } from '../entities/promise';
import { useListAccounts } from './accounts';

const CREATION_DATE = '2023-03-27T12:58:13.000Z';
const ACCOUNTS_COUNT = 1001;

const STORAGE_USAGE_REPORT: StorageUsageReport = {
  accounts: { [ACCOUNT_NAME]: { 'us-east-1': 1000, 'artesca-s3-location': 24 } },
  retrievedOn: new Date(MEASURED_ON),
};

const setupAdapters = (report: StorageUsageReport = STORAGE_USAGE_REPORT) => {
  const accessibleAccountsAdapter = new MockedAccessibleAccounts();
  const metricsAdapter = new MockedMetricsAdapter();
  metricsAdapter.getStorageUsageReport = jest.fn().mockResolvedValue(report);
  return { accessibleAccountsAdapter, metricsAdapter };
};

const setupAdaptersForManyAccounts = () => {
  const accountNames = new Array(ACCOUNTS_COUNT).fill(null).map((_, i) => `name-${i}`);
  const { accessibleAccountsAdapter, metricsAdapter } = setupAdapters({
    accounts: Object.fromEntries(accountNames.map((name) => [name, { 'us-east-1': 1024 }])),
    retrievedOn: new Date(MEASURED_ON),
  });
  accessibleAccountsAdapter.useListAccessibleAccounts = jest.fn().mockImplementation(
    (): {
      accountInfos: PromiseResult<AccountInfo[]>;
    } => {
      return {
        accountInfos: {
          status: 'success',
          value: accountNames.map((name, i) => {
            return {
              id: `id-${i}`,
              name,
              canonicalId: `canonicalId-${i}`,
              creationDate: new Date(CREATION_DATE),
              assumableRoles: [
                {
                  Arn: 'arn:aws:iam::123456789012:role/' + STORAGE_ACCOUNT_OWNER_ROLE,
                  Name: STORAGE_ACCOUNT_OWNER_ROLE,
                },
              ],
            };
          }),
        },
      };
    },
  );
  return { accessibleAccountsAdapter, metricsAdapter };
};

const genManyAccounts = (usedCapacity: unknown) =>
  new Array(ACCOUNTS_COUNT).fill(null).map((_, i) => {
    return {
      id: `id-${i}`,
      name: `name-${i}`,
      canonicalId: `canonicalId-${i}`,
      creationDate: new Date(CREATION_DATE),
      usedCapacity,
      assumableRoles: DEFAULT_ASSUMABLE_ROLES,
      preferredAssumableRoleArn: DEFAULT_ASSUMABLE_ROLES_ARN,
      canManageAccount: true,
    };
  });

const MOCK_ACCESSIBLE_ACCOUNTS = [
  {
    ...ACCESSIBLE_ACCOUNTS_EXAMPLE[0],
    preferredAssumableRoleArn: ACCESSIBLE_ACCOUNTS_EXAMPLE[0].assumableRoles[0].Arn,
    canManageAccount: true,
  },
  {
    ...ACCESSIBLE_ACCOUNTS_EXAMPLE[1],
    preferredAssumableRoleArn: ACCESSIBLE_ACCOUNTS_EXAMPLE[1].assumableRoles[0].Arn,
    canManageAccount: true,
  },
];

const EXPECTED_ACCOUNTS_WITH_METRICS = [
  {
    ...MOCK_ACCESSIBLE_ACCOUNTS[0],
    usedCapacity: { status: 'success', value: ACCOUNT_METRICS },
  },
  {
    ...MOCK_ACCESSIBLE_ACCOUNTS[1],
    usedCapacity: { status: 'success', value: NEWLY_CREATED_ACCOUNT_METRICS },
  },
];

describe('useListAccounts', () => {
  beforeEach(() => queryClient.clear());
  afterEach(() => resetUserGroups());

  it('should return accounts as soon as it is resolved', async () => {
    //S
    const { accessibleAccountsAdapter, metricsAdapter } = setupAdapters();
    metricsAdapter.getStorageUsageReport = jest.fn(() => new Promise(() => {}));
    //E
    const { result, waitFor } = renderHook(() => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }), {
      wrapper: NewWrapper(),
    });
    await waitFor(() => result.current.accounts.status === 'success');
    //V
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: [
        {
          ...MOCK_ACCESSIBLE_ACCOUNTS[0],
          usedCapacity: { status: 'loading' },
        },
        {
          ...MOCK_ACCESSIBLE_ACCOUNTS[1],
          usedCapacity: { status: 'loading' },
        },
      ],
    });
  });

  it('should return accounts and their used capacity from the storage usage report when user is storage manager', async () => {
    //S
    const { accessibleAccountsAdapter, metricsAdapter } = setupAdapters();
    //E
    const { result, waitFor } = renderHook(() => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }), {
      wrapper: NewWrapper(),
    });
    await waitFor(
      () =>
        result.current.accounts.status === 'success' &&
        result.current.accounts.value[0].usedCapacity.status === 'success',
    );
    //V
    expect(result.current.accounts).toStrictEqual({ status: 'success', value: EXPECTED_ACCOUNTS_WITH_METRICS });
  });

  it('should not let a screen that lists accounts without metrics replace the shared storage usage report', async () => {
    //S
    const { accessibleAccountsAdapter, metricsAdapter } = setupAdapters();
    const withoutMetrics = renderHook(() => useListAccounts({ accessibleAccountsAdapter }), {
      wrapper: NewWrapper(),
    });
    await withoutMetrics.waitFor(() => withoutMetrics.result.current.accounts.status === 'success');
    await new Promise(setImmediate);
    expect(withoutMetrics.result.current.accounts).toMatchObject({
      status: 'success',
      value: [{ usedCapacity: { status: 'unknown' } }, { usedCapacity: { status: 'unknown' } }],
    });
    withoutMetrics.unmount();
    //E
    const { result, waitFor } = renderHook(() => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }), {
      wrapper: NewWrapper(),
    });
    await waitFor(
      () =>
        result.current.accounts.status === 'success' &&
        result.current.accounts.value[0].usedCapacity.status === 'success',
    );
    //V
    expect(metricsAdapter.getStorageUsageReport).toHaveBeenCalledTimes(1);
    expect(result.current.accounts).toStrictEqual({ status: 'success', value: EXPECTED_ACCOUNTS_WITH_METRICS });
  });

  it('should return accounts and their used capacity from the storage usage report when user is storage usage reporter', async () => {
    //S
    mockUserGroups(['StorageUsageReporter']);
    const { accessibleAccountsAdapter, metricsAdapter } = setupAdapters();
    //E
    const { result, waitFor } = renderHook(() => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }), {
      wrapper: NewWrapper(),
    });
    await waitFor(
      () =>
        result.current.accounts.status === 'success' &&
        result.current.accounts.value[0].usedCapacity.status === 'success',
    );
    //V
    expect(result.current.accounts).toStrictEqual({ status: 'success', value: EXPECTED_ACCOUNTS_WITH_METRICS });
  });

  it('should not fetch the storage usage report when user is neither storage manager nor storage usage reporter', async () => {
    //S
    mockUserGroups(['PlatformAdmin']);
    const { accessibleAccountsAdapter, metricsAdapter } = setupAdapters();
    //E
    const { result, waitFor } = renderHook(() => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }), {
      wrapper: NewWrapper(),
    });
    await waitFor(() => result.current.accounts.status === 'success');
    //V
    expect(metricsAdapter.getStorageUsageReport).not.toHaveBeenCalled();
    expect(result.current.accounts.status === 'success' && result.current.accounts.value[0].usedCapacity).toStrictEqual(
      { status: 'loading' },
    );
  });

  it('should return the used capacity of every account, even when there are more than a thousand', async () => {
    //S
    const { accessibleAccountsAdapter, metricsAdapter } = setupAdaptersForManyAccounts();
    //E
    const { result, waitFor } = renderHook(() => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }), {
      wrapper: NewWrapper(),
    });
    await waitFor(
      () =>
        result.current.accounts.status === 'success' &&
        result.current.accounts.value[0].usedCapacity.status === 'success',
    );
    //V
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: genManyAccounts({
        status: 'success',
        value: {
          type: 'hasMetrics',
          usedCapacity: { current: 1024, nonCurrent: 0 },
          measuredOn: new Date(MEASURED_ON),
        },
      }),
    });
  });

  it('should return an error in case of fetching accounts failed', async () => {
    //S
    const { accessibleAccountsAdapter, metricsAdapter } = setupAdapters();
    accessibleAccountsAdapter.useListAccessibleAccounts = jest.fn().mockImplementation(() => {
      return { accountInfos: { status: 'error' } };
    });
    //E
    const { result, waitFor } = renderHook(() => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }), {
      wrapper: NewWrapper(),
    });
    //V
    await waitFor(() => result.current.accounts.status === 'error');
    expect(result.current.accounts).toStrictEqual({
      status: 'error',
      title: 'List accounts error',
      reason: 'An error occurred when fetching accounts',
    });
  });

  it('should return accounts with an error in case of fetching the storage usage report failed', async () => {
    //S
    const { accessibleAccountsAdapter, metricsAdapter } = setupAdaptersForManyAccounts();
    metricsAdapter.getStorageUsageReport = jest.fn().mockRejectedValue(new Error('Forbidden'));
    //E
    const { result, waitFor } = renderHook(() => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }), {
      wrapper: NewWrapper(),
    });
    await waitFor(
      () =>
        result.current.accounts.status === 'success' &&
        result.current.accounts.value[0].usedCapacity.status === 'error',
      { timeout: 5000 },
    );
    //V
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: genManyAccounts({
        status: 'error',
        title: 'Account metrics error',
        reason: 'An error occurred when fetching metrics',
      }),
    });
  });

  it('should reflect the latest accountInfos.value when an account is removed while status stays success', async () => {
    //S
    const { accessibleAccountsAdapter, metricsAdapter } = setupAdapters();
    //E
    const { result, waitFor, rerender } = renderHook(
      () => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }),
      {
        wrapper: NewWrapper(),
      },
    );
    await waitFor(
      () =>
        result.current.accounts.status === 'success' &&
        result.current.accounts.value[0].usedCapacity.status === 'success',
    );
    expect(result.current.accounts).toStrictEqual({ status: 'success', value: EXPECTED_ACCOUNTS_WITH_METRICS });

    //S
    accessibleAccountsAdapter.useListAccessibleAccounts = jest.fn().mockImplementation(
      (): {
        accountInfos: PromiseResult<AccountInfo[]>;
      } => {
        return {
          accountInfos: {
            status: 'success',
            value: [ACCESSIBLE_ACCOUNTS_EXAMPLE[0]],
          },
        };
      },
    );
    //E
    rerender();
    //V
    await waitFor(() => result.current.accounts.status === 'success' && result.current.accounts.value.length === 1);
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: [EXPECTED_ACCOUNTS_WITH_METRICS[0]],
    });
  });

  it('should keep the used capacity of the last report when refetching it fails', async () => {
    //S
    const { accessibleAccountsAdapter, metricsAdapter } = setupAdapters();
    const { result, waitFor } = renderHook(() => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }), {
      wrapper: NewWrapper(),
    });
    await waitFor(
      () =>
        result.current.accounts.status === 'success' &&
        result.current.accounts.value[0].usedCapacity.status === 'success',
    );
    metricsAdapter.getStorageUsageReport = jest.fn().mockRejectedValue(new Error('Forbidden'));
    //E
    await act(() => queryClient.refetchQueries(['storageUsageReport']));
    //V
    expect(queryClient.getQueryState(['storageUsageReport'])?.status).toBe('error');
    expect(result.current.accounts).toStrictEqual({ status: 'success', value: EXPECTED_ACCOUNTS_WITH_METRICS });
  });
});
