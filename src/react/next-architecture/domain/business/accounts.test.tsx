import { renderHook } from '@testing-library/react-hooks';
import { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter } from 'react-router';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { XDM_FEATURE } from '../../../../js/config';
import {
  ACCOUNT_CANONICAL_ID,
  ACCOUNT_METRICS,
  MEASURED_ON,
  NEWLY_CREATED_ACCOUNT_METRICS,
} from '../../../../js/mock/managementClientMSWHandlers';
import { AppConfig } from '../../../../types/entities';
import { prepareRenderMultipleHooks } from '../../../utils/testMultipleHooks';
import { IAccessibleAccounts } from '../../adapters/accessible-accounts/IAccessibleAccounts';
import {
  MockedAccessibleAccounts,
  ACCESSIBLE_ACCOUNTS_EXAMPLE,
  DEFAULT_ASSUMABLE_ROLES,
  DEFAULT_ASSUMABLE_ROLES_ARN,
} from '../../adapters/accessible-accounts/MockedAccessibleAccounts';
import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import { MockedMetricsAdapter } from '../../adapters/metrics/MockedMetricsAdapter';
import { AccountInfo } from '../entities/account';
import { LatestUsedCapacity } from '../entities/metrics';
import { useAccountLatestUsedCapacity, useListAccounts } from './accounts';
import { _AuthContext } from '../../ui/AuthProvider';
import { ConfigProvider } from '../../ui/ConfigProvider';
import { PromiseResult } from '../entities/promise';
import { STORAGE_ACCOUNT_OWNER_ROLE } from '../../../utils/hooks';

const CREATION_DATE = '2023-03-27T12:58:13.000Z';

const setupListAccountAdaptersForThousandAccounts = () => {
  const accessibleAccountsAdapter = new MockedAccessibleAccounts();
  const metricsAdapter = new MockedMetricsAdapter();
  accessibleAccountsAdapter.useListAccessibleAccounts = jest
    .fn()
    .mockImplementation(
      (): {
        accountInfos: PromiseResult<AccountInfo[]>;
      } => {
        return {
          accountInfos: {
            status: 'success',
            value: new Array(1001).fill(null).map((_, i) => {
              return {
                id: `id-${i}`,
                name: `name-${i}`,
                canonicalId: `canonicalId-${i}`,
                creationDate: new Date(CREATION_DATE),
                assumableRoles: [
                  {
                    Arn:
                      'arn:aws:iam::123456789012:role/' +
                      STORAGE_ACCOUNT_OWNER_ROLE,
                    Name: STORAGE_ACCOUNT_OWNER_ROLE,
                  },
                ],
              };
            }),
          },
        };
      },
    );
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
  return { accessibleAccountsAdapter, metricsAdapter };
};
const MOCK_SUCCESS_USED_CAPACITY = {
  status: 'success',
  value: {
    type: 'hasMetrics',
    usedCapacity: {
      current: 1024,
      nonCurrent: 0,
    },
    measuredOn: new Date(MEASURED_ON),
  },
};
const MOCK_ONE_THOUSAND_ACCOUNTS = new Array(1000).fill(null).map((_, i) => {
  return {
    id: `id-${i}`,
    name: `name-${i}`,
    canonicalId: `canonicalId-${i}`,
    creationDate: new Date(CREATION_DATE),
    usedCapacity: MOCK_SUCCESS_USED_CAPACITY,
    assumableRoles: DEFAULT_ASSUMABLE_ROLES,
    preferredAssumableRoleArn: DEFAULT_ASSUMABLE_ROLES_ARN,
    canManageAccount: true,
  };
});

const MOCK_ONE_THOUSAND_ACCOUNTS_ERROR_USED_CAPACITY = new Array(1000)
  .fill(null)
  .map((_, i) => {
    return {
      id: `id-${i}`,
      name: `name-${i}`,
      canonicalId: `canonicalId-${i}`,
      creationDate: new Date(CREATION_DATE),
      usedCapacity: {
        status: 'error',
        title: 'Account metrics error',
        reason: 'An error occurred when fetching metrics',
      },
      assumableRoles: DEFAULT_ASSUMABLE_ROLES,
      preferredAssumableRoleArn: DEFAULT_ASSUMABLE_ROLES_ARN,
      canManageAccount: true,
    };
  });

const ONE_THOUSAND_AND_ONE_ACCOUNT = {
  id: 'id-1000',
  name: 'name-1000',
  canonicalId: `canonicalId-1000`,
  creationDate: new Date(CREATION_DATE),
  usedCapacity: { status: 'unknown' },
  assumableRoles: DEFAULT_ASSUMABLE_ROLES,
  preferredAssumableRoleArn: DEFAULT_ASSUMABLE_ROLES_ARN,
  canManageAccount: true,
};

const MOCK_ACCESSIBLE_ACCOUNTS = [
  {
    ...ACCESSIBLE_ACCOUNTS_EXAMPLE[0],
    preferredAssumableRoleArn:
      ACCESSIBLE_ACCOUNTS_EXAMPLE[0].assumableRoles[0].Arn,
    canManageAccount: true,
  },
  {
    ...ACCESSIBLE_ACCOUNTS_EXAMPLE[1],
    preferredAssumableRoleArn:
      ACCESSIBLE_ACCOUNTS_EXAMPLE[1].assumableRoles[0].Arn,
    canManageAccount: true,
  },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const ACCESS_TOKEN = 'token';
const config: AppConfig = {
  zenkoEndpoint: 'http://localhost:8000',
  stsEndpoint: 'http://localhost:9000',
  iamEndpoint: 'http://localhost:10000',
  managementEndpoint: 'http://localhost:11000',
  navbarEndpoint: 'http://localhost:12000',
  navbarConfigUrl: 'http://localhost:13000',
  features: [XDM_FEATURE],
};
const Wrapper = ({ children }: PropsWithChildren<Record<string, never>>) => {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <_AuthContext.Provider
          value={{
            //@ts-ignore
            user: { access_token: ACCESS_TOKEN, profile: { sub: 'test' } },
          }}
        >
          <ConfigProvider>{children}</ConfigProvider>
        </_AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};
function mockConfig() {
  return rest.get(`http://localhost/config.json`, (req, res, ctx) => {
    return res(ctx.json(config));
  });
}
const server = setupServer(mockConfig());
beforeEach(() => {
  queryClient.clear();
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useListAccounts', () => {
  it('should return accounts as soon as it is resolved', async () => {
    //S
    const accessibleAccountsAdapter = new MockedAccessibleAccounts();
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
      () => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }),
      { wrapper: Wrapper },
    );
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

  it('should return accounts and metrics', async () => {
    //S
    const metricsAdapter = new MockedMetricsAdapter();
    const accessibleAccountsAdapter = new MockedAccessibleAccounts();
    //E
    const { result, waitFor } = renderHook(
      () => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }),
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
          ...MOCK_ACCESSIBLE_ACCOUNTS[0],
          usedCapacity: { status: 'success', value: ACCOUNT_METRICS },
        },
        {
          ...MOCK_ACCESSIBLE_ACCOUNTS[1],
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
    const { accessibleAccountsAdapter, metricsAdapter } =
      setupListAccountAdaptersForThousandAccounts();
    //E
    const { result, waitFor } = renderHook(
      () => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }),
      { wrapper: Wrapper },
    );
    await waitFor(() => result.current.accounts.status === 'success');
    //Verify the status of usedCapacity after a thousand account should be unknown.
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: [...MOCK_ONE_THOUSAND_ACCOUNTS, ONE_THOUSAND_AND_ONE_ACCOUNT],
    });
  });

  it('should return an error in case of fetching accounts failed', async () => {
    //S
    const accessibleAccountsAdapter = new MockedAccessibleAccounts();
    const metricsAdapter = new MockedMetricsAdapter();
    accessibleAccountsAdapter.useListAccessibleAccounts = jest
      .fn()
      .mockImplementation(() => {
        return { accountInfos: { status: 'error' } };
      });
    //E
    const { result, waitFor } = renderHook(
      () => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }),
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
    const { accessibleAccountsAdapter, metricsAdapter } =
      setupListAccountAdaptersForThousandAccounts();
    metricsAdapter.listAccountsLatestUsedCapacity = jest
      .fn()
      .mockImplementation(async () => {
        return Promise.reject('error');
      });
    //E
    const { result, waitFor } = renderHook(
      () => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }),
      { wrapper: Wrapper },
    );
    await waitFor(() => result.current.accounts.status === 'success');
    //Verify the status of usedCapacity after a thousand account should be unknown.
    expect(result.current.accounts).toStrictEqual({
      status: 'success',
      value: [
        ...MOCK_ONE_THOUSAND_ACCOUNTS_ERROR_USED_CAPACITY,
        ONE_THOUSAND_AND_ONE_ACCOUNT,
      ],
    });
  });
});

// In order to retrieve metrics, the listAccounts should be success
const setUpTest = async ({
  metricsAdapter,
  accessibleAccountsAdapter,
}: {
  metricsAdapter: IMetricsAdapter;
  accessibleAccountsAdapter: IAccessibleAccounts;
}) => {
  const { renderAdditionalHook, waitForWrapperToBeReady } =
    prepareRenderMultipleHooks({
      wrapper: Wrapper,
    });
  await waitForWrapperToBeReady();
  const { waitFor, result: resultAccounts } = renderAdditionalHook(
    'listAccounts',
    () => useListAccounts({ accessibleAccountsAdapter, metricsAdapter }),
  );
  await waitFor(() => resultAccounts.current.accounts.status === 'success');
  return { renderAdditionalHook, waitFor, resultAccounts };
};

describe('useAccountLatestUsedCapacity', () => {
  it('should return metrics direcly from cache if listAccountMetrics has done', async () => {
    //S
    const accessibleAccountsAdapter = new MockedAccessibleAccounts();
    const metricsAdapter = new MockedMetricsAdapter();
    const { renderAdditionalHook } = await setUpTest({
      metricsAdapter,
      accessibleAccountsAdapter,
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
    const { accessibleAccountsAdapter, metricsAdapter } =
      setupListAccountAdaptersForThousandAccounts();

    const { renderAdditionalHook, waitFor, resultAccounts } = await setUpTest({
      metricsAdapter,
      accessibleAccountsAdapter,
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
    await waitFor(() => {
      return result.current.usedCapacity.status === 'success';
    });
    //V
    expect(result.current.usedCapacity).toStrictEqual({
      status: 'success',
      value: ACCOUNT_METRICS,
    });
  });

  it('should return error in case of fetching metrics failed', async () => {
    //S
    const metricsAdapter = new MockedMetricsAdapter();
    const accessibleAccountsAdapter = new MockedAccessibleAccounts();

    metricsAdapter.listAccountsLatestUsedCapacity = jest
      .fn()
      .mockImplementation(async () => Promise.reject('error'));
    const { renderAdditionalHook } = await setUpTest({
      metricsAdapter,
      accessibleAccountsAdapter,
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
      reason: 'An error occurred when fetching the metrics',
    });
  });
  it('should return loading status while listAccounts query has not be success', async () => {
    //S
    const accessibleAccountsAdapter = new MockedAccessibleAccounts();
    const metricsAdapter = new MockedMetricsAdapter();
    accessibleAccountsAdapter.useListAccessibleAccounts = jest
      .fn()
      .mockImplementation(() => {
        return {
          accountInfos: {
            status: 'loading',
          },
        };
      });
    //E
    const { renderAdditionalHook, waitForWrapperToBeReady } =
      prepareRenderMultipleHooks({
        wrapper: Wrapper,
      });
    await waitForWrapperToBeReady();
    const { result } = renderAdditionalHook('accountMetrics', () =>
      useAccountLatestUsedCapacity({
        metricsAdapter,
        accountCanonicalId: ACCOUNT_CANONICAL_ID,
      }),
    );
    //V
    expect(result.current.usedCapacity.status).toBe('loading');
  });
});
