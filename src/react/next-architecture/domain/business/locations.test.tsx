import { ShellHooksProvider } from '@scality/module-federation';
import { act, renderHook } from '@testing-library/react-hooks';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { QueryClient } from 'react-query';
import { QueryClientProvider } from '../../../../QueryClientProvider';
import type { LocationTypeKey } from '../../../../types/config';
import * as DSRProvider from '../../../DataServiceRoleProvider';
import { _ManagementContext } from '../../../ManagementProvider';
import {
  mockShellAlerts,
  mockShellHooks,
  mockUserGroups,
  resetUserGroups,
  TEST_API_BASE_URL,
  TEST_MANAGEMENT_CLIENT,
  WrapperAsStorageManager,
} from '../../../utils/testUtil';
import { MockedAccessibleAccounts } from '../../adapters/accessible-accounts/MockedAccessibleAccounts';
import { MockedAccountsLocationsAdapter } from '../../adapters/accounts-locations/MockedAccountsLocationsAdapter';
import {
  DEFAULT_METRICS,
  DEFAULT_METRICS_MESURED_ON,
  DEFAULT_STORAGE_USAGE_REPORT,
  MockedMetricsAdapter,
} from '../../adapters/metrics/MockedMetricsAdapter';
import type { Location, LocationsPromiseResult } from '../entities/location';
import type { LatestUsedCapacity } from '../entities/metrics';
import type { PromiseResult } from '../entities/promise';
import { useListAccounts } from './accounts';
import { useListLocations, useListLocationsForCurrentAccount } from './locations';

const defaultUsedCapacity = {
  status: 'success' as const,
  value: DEFAULT_METRICS,
};

const genLocation = (
  id = 'fakeid',
  type: LocationTypeKey = 'location-scality-artesca-s3-v1',
  details = {},
  usedCapacity: PromiseResult<LatestUsedCapacity> = defaultUsedCapacity,
): Location => {
  return {
    id: id,
    name: id,
    type: type,
    details: details,
    usedCapacity: usedCapacity,
  };
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
const server = setupServer(
  rest.get(`${TEST_API_BASE_URL}/api/v1/instance/:instanceId/status`, (_req, res, ctx) => res(ctx.json({}))),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const Wrapper = ({ children }: PropsWithChildren<Record<string, never>>) => {
  return (
    <WrapperAsStorageManager isStorageManager={true}>
      <ShellHooksProvider shellHooks={mockShellHooks} shellAlerts={mockShellAlerts}>
        <QueryClientProvider client={queryClient}>
          <_ManagementContext.Provider value={{ managementClient: TEST_MANAGEMENT_CLIENT }}>
            {children}
          </_ManagementContext.Provider>
        </QueryClientProvider>
      </ShellHooksProvider>
    </WrapperAsStorageManager>
  );
};

const genExpectedLocation = (
  usedCapacity: PromiseResult<LatestUsedCapacity> = defaultUsedCapacity,
): LocationsPromiseResult => {
  const details = {
    accessKey: 'xxx-access-key',
    secretKey: 'yyy-secret-key',
    bucketName: 'test-s3-bucket',
    endpoint: 'https://s3.scality.com',
    region: 'us-east-1',
  };
  return {
    locations: {
      status: 'success' as const,
      value: {
        'artesca-s3-location': genLocation(
          'artesca-s3-location',
          'location-scality-artesca-s3-v1',
          details,
          usedCapacity,
        ),
        'artesca-jaguar-location': genLocation(
          'artesca-jaguar-location',
          'location-jaguar-ring-s3-v1',
          details,
          usedCapacity,
        ),
        'us-east-1': {
          isBuiltin: true,
          type: 'location-file-v1',
          name: 'us-east-1',
          id: '95dbedf5-9888-11ec-8565-1ac2af7d1e53',
          usedCapacity,
          details: {
            bootstrapList: ['artesca-storage-service-hdservice-proxy.xcore.svc:18888'],
          },
        },
      },
    },
  };
};

describe('useListLocations', () => {
  beforeEach(() => queryClient.clear());

  const setupAndRenderHook = (
    locationsEndpointsAdapter = new MockedAccountsLocationsAdapter(),
    metricsAdapter = new MockedMetricsAdapter(),
  ) => {
    return {
      ...renderHook(
        () =>
          useListLocations({
            locationsEndpointsAdapter,
            metricsAdapter: metricsAdapter,
          }),
        {
          wrapper: Wrapper,
        },
      ),
      metricsAdapter,
    };
  };

  const flushPromises = () => new Promise(setImmediate);

  it('should return the locations with metrics', async () => {
    // S
    const { result, waitFor } = setupAndRenderHook();

    await flushPromises();
    // E
    await waitFor(() => {
      return (
        result.current.locations.status === 'success' &&
        result.current.locations.value['artesca-s3-location'].usedCapacity.status === 'success'
      );
    });

    // V
    const expectedRes = genExpectedLocation();
    expect(result.current).toStrictEqual(expectedRes);
  });

  it('should return locations loading', async () => {
    // S
    const mockAccountAdapter = new MockedAccountsLocationsAdapter();
    mockAccountAdapter.listLocationsAndEndpoints = jest.fn(() => new Promise(() => {}));
    const { result, waitFor } = setupAndRenderHook(mockAccountAdapter);

    await flushPromises();
    // E
    await waitFor(() => result.current.locations.status === 'loading');

    // V
    const expectedRes = {
      locations: { status: 'loading' },
    };
    expect(result.current).toStrictEqual(expectedRes);
  });

  it('should return locations with error', async () => {
    // S
    const mockAccountAdapter = new MockedAccountsLocationsAdapter();
    mockAccountAdapter.listLocationsAndEndpoints = jest.fn(() => Promise.reject());
    const { result, waitFor } = setupAndRenderHook(mockAccountAdapter);

    await flushPromises();
    // E
    await waitFor(() => result.current.locations.status === 'error');

    // V
    const expectedRes = {
      locations: {
        status: 'error',
        title: 'Location Error',
        reason: 'Unexpected error while fetching location',
      },
    };
    expect(result.current).toStrictEqual(expectedRes);
  });

  it('should return locations and return loading metrics', async () => {
    // S
    const mockAccountAdapter = new MockedAccountsLocationsAdapter();
    const mockMetricsAdapter = new MockedMetricsAdapter();
    mockMetricsAdapter.getStorageUsageReport = jest.fn(() => new Promise(() => {}));
    const { result, waitFor } = setupAndRenderHook(mockAccountAdapter, mockMetricsAdapter);

    await flushPromises();
    // E
    await waitFor(() => result.current.locations.status === 'success');

    // V
    const expectedRes = genExpectedLocation({ status: 'loading' });
    expect(result.current).toStrictEqual(expectedRes);
  });

  it('should return locations with error metrics', async () => {
    // S
    const mockAccountAdapter = new MockedAccountsLocationsAdapter();
    const mockMetricsAdapter = new MockedMetricsAdapter();
    mockMetricsAdapter.getStorageUsageReport = jest.fn(() => Promise.reject());
    const { result, waitFor } = setupAndRenderHook(mockAccountAdapter, mockMetricsAdapter);

    await flushPromises();
    // E
    await waitFor(
      () =>
        result.current.locations.status === 'success' &&
        result.current.locations.value['artesca-s3-location'].usedCapacity.status === 'error',
      { timeout: 5000 },
    );

    // V
    const expectedRes = genExpectedLocation({
      status: 'error',
      title: 'Location Metrics Error',
      reason: `Unexpected error while fetching location's metrics`,
    });
    expect(result.current).toStrictEqual(expectedRes);
  });
});

describe('useListLocationsForCurrentAccount', () => {
  const setupAndRenderHook = (
    locationsEndpointsAdapter = new MockedAccountsLocationsAdapter(),
    metricsAdapter = new MockedMetricsAdapter(),
  ) => {
    return {
      ...renderHook(
        () =>
          useListLocationsForCurrentAccount({
            locationsEndpointsAdapter,
            metricsAdapter: metricsAdapter,
          }),
        {
          wrapper: Wrapper,
        },
      ),
      metricsAdapter,
    };
  };

  beforeEach(() => {
    queryClient.clear();
    jest.spyOn(DSRProvider, 'useCurrentAccount').mockReturnValue({
      account: {
        id: 'account-id-renard',
        Name: 'Renard',
        Roles: [],
        CreationDate: DEFAULT_METRICS_MESURED_ON,
        CanonicalId: 'canonical-id-renard',
      },
    });
    new MockedAccountsLocationsAdapter();
  });
  afterEach(() => resetUserGroups());

  it('should return only location for current account', async () => {
    jest.spyOn(DSRProvider, 'useCurrentAccount').mockReturnValue({
      account: {
        id: 'account-with-own-metrics',
        Name: 'Souris',
        Roles: [],
        CreationDate: DEFAULT_METRICS_MESURED_ON,
        CanonicalId: 'canonical-id-souris-diff-metrics',
      },
    });

    // S
    const metricsAdapter = new MockedMetricsAdapter();
    metricsAdapter.getStorageUsageReport = jest.fn().mockResolvedValue({
      ...DEFAULT_STORAGE_USAGE_REPORT,
      accounts: { ...DEFAULT_STORAGE_USAGE_REPORT.accounts, Souris: { 'artesca-s3-location': 135000 } },
    });
    const { result, waitFor } = setupAndRenderHook(new MockedAccountsLocationsAdapter(), metricsAdapter);

    // E
    await waitFor(() => {
      return result.current.locations.status === 'success';
    });

    // V
    const expectedRes = {
      locations: {
        status: 'success' as const,
        value: {
          'artesca-s3-location': genLocation(
            'artesca-s3-location',
            'location-scality-artesca-s3-v1',
            {
              accessKey: 'xxx-access-key',
              secretKey: 'yyy-secret-key',
              bucketName: 'test-s3-bucket',
              endpoint: 'https://s3.scality.com',
              region: 'us-east-1',
            },
            {
              status: 'success',
              value: {
                type: 'hasMetrics',
                usedCapacity: { current: 135000, nonCurrent: 0 },
                measuredOn: DEFAULT_METRICS_MESURED_ON,
              },
            },
          ),
        },
      },
    };
    expect(result.current).toStrictEqual(expectedRes);
  });

  it('should return empty object if no location is link to account', async () => {
    // S
    jest.spyOn(DSRProvider, 'useCurrentAccount').mockReturnValue({
      account: {
        id: 'account-without-location',
        Name: 'Renard',
        Roles: [],
        CreationDate: DEFAULT_METRICS_MESURED_ON,
        CanonicalId: 'canonical-id-renard-without-location',
      },
    });
    const { result, waitFor } = setupAndRenderHook();

    // E
    await waitFor(() => {
      return result.current.locations.status === 'success';
    });

    // V
    const expectedRes = {
      locations: {
        status: 'success',
        value: {},
      },
    };
    expect(result.current).toStrictEqual(expectedRes);
  });

  it('should throw error account cannot be retreive', async () => {
    // S
    jest.spyOn(DSRProvider, 'useCurrentAccount').mockReturnValue({
      account: undefined,
    });

    const { result, waitFor } = setupAndRenderHook();

    // E
    await waitFor(() => {
      return result.current.locations.status === 'error';
    });

    // V
    const expectedRes = {
      locations: {
        status: 'error',
        title: 'Current Account Error',
        reason: `Unexpected error while fetching account`,
      },
    };
    expect(result.current).toStrictEqual(expectedRes);
  });

  it(`should return loading when loading account's locations`, () => {
    // S
    const mockAccountAdapter = new MockedAccountsLocationsAdapter();
    const mockMetricsAdapter = new MockedMetricsAdapter();
    mockMetricsAdapter.getStorageUsageReport = jest.fn(() => new Promise(() => {}));
    const { result } = setupAndRenderHook(mockAccountAdapter, mockMetricsAdapter);

    // V
    const expectedRes = {
      locations: {
        status: 'loading',
      },
    };
    expect(result.current).toStrictEqual(expectedRes);
  });

  it(`should keep the account's bucket-backed locations, with a Data Used error, when the storage usage report fails`, async () => {
    // S
    server.use(
      rest.get(`${TEST_API_BASE_URL}/api/v1/instance/:instanceId/status`, (_req, res, ctx) =>
        res(
          ctx.json({
            metrics: {
              'item-counts': {
                bucketList: [{ name: 'renard-bucket', location: 'us-east-1', ownerCanonicalId: 'canonical-id-renard' }],
              },
            },
          }),
        ),
      ),
    );
    const mockMetricsAdapter = new MockedMetricsAdapter();
    mockMetricsAdapter.getStorageUsageReport = jest.fn(() => Promise.reject());
    const { result, waitFor } = setupAndRenderHook(new MockedAccountsLocationsAdapter(), mockMetricsAdapter);

    // E
    await waitFor(() => result.current.locations.status === 'success', { timeout: 5000 });

    // V
    if (result.current.locations.status !== 'success') {
      throw new Error('expected locations to be successfully loaded');
    }
    const value = result.current.locations.value;
    expect(Object.keys(value)).toEqual(['95dbedf5-9888-11ec-8565-1ac2af7d1e53']);
    expect(value['95dbedf5-9888-11ec-8565-1ac2af7d1e53'].usedCapacity).toStrictEqual({
      status: 'error',
      title: 'Account Location Metrics Error',
      reason: `Unexpected error while fetching account location's metrics`,
    });
  });

  it(`should list the account's bucket-backed locations without the storage usage report for a user without a usage role`, async () => {
    // S
    mockUserGroups(['PlatformAdmin']);
    server.use(
      rest.get(`${TEST_API_BASE_URL}/api/v1/instance/:instanceId/status`, (_req, res, ctx) =>
        res(
          ctx.json({
            metrics: {
              'item-counts': {
                bucketList: [{ name: 'renard-bucket', location: 'us-east-1', ownerCanonicalId: 'canonical-id-renard' }],
              },
            },
          }),
        ),
      ),
    );
    const { result, waitFor, metricsAdapter } = setupAndRenderHook();

    // E
    await waitFor(() => result.current.locations.status === 'success');

    // V
    if (result.current.locations.status !== 'success') {
      throw new Error('expected locations to be successfully loaded');
    }
    const value = result.current.locations.value;
    expect(Object.keys(value)).toEqual(['95dbedf5-9888-11ec-8565-1ac2af7d1e53']);
    expect(value['95dbedf5-9888-11ec-8565-1ac2af7d1e53'].usedCapacity).toStrictEqual({ status: 'unknown' });
    expect(metricsAdapter.getStorageUsageReport).not.toHaveBeenCalled();
  });

  it('should return an error when `useListLocations` return one', async () => {
    // S
    const mockAccountAdapter = new MockedAccountsLocationsAdapter();
    const mockMetricsAdapter = new MockedMetricsAdapter();
    mockAccountAdapter.listLocationsAndEndpoints = jest.fn(() => Promise.reject());
    const { result, waitFor } = setupAndRenderHook(mockAccountAdapter, mockMetricsAdapter);

    // E
    await waitFor(() => {
      return result.current.locations.status === 'error';
    });

    // V
    expect(result.current.locations.status).toBe('error');
  });

  it('account without canonicalId returns empty locations', async () => {
    // S
    jest.spyOn(DSRProvider, 'useCurrentAccount').mockReturnValue({
      account: {
        id: 'account-id-no-canonical',
        Name: 'Unknown',
        Roles: [],
        CreationDate: DEFAULT_METRICS_MESURED_ON,
        CanonicalId: '',
      },
    });
    const { result, waitFor } = setupAndRenderHook();

    // E
    await waitFor(() => {
      return result.current.locations.status === 'success';
    });

    // V
    const expectedRes = {
      locations: {
        status: 'success',
        value: {},
      },
    };
    expect(result.current).toStrictEqual(expectedRes);
  });

  it('shows a location backed only by a freshly created bucket, resolving the bucket location name to its id', async () => {
    // S
    jest.spyOn(DSRProvider, 'useCurrentAccount').mockReturnValue({
      account: {
        id: 'account-id-bucket-only',
        Name: 'BucketOnly',
        Roles: [],
        CreationDate: DEFAULT_METRICS_MESURED_ON,
        CanonicalId: 'canonical-id-bucket-only',
      },
    });
    // The account has no location metrics yet, but owns a bucket on `us-east-1`
    // whose location id (95dbedf5-...) differs from its name.
    server.use(
      rest.get(`${TEST_API_BASE_URL}/api/v1/instance/:instanceId/status`, (_req, res, ctx) =>
        res(
          ctx.json({
            metrics: {
              'item-counts': {
                bucketList: [
                  {
                    name: 'freshly-created-bucket',
                    location: 'us-east-1',
                    ownerCanonicalId: 'canonical-id-bucket-only',
                  },
                ],
              },
            },
          }),
        ),
      ),
    );

    const { result, waitFor } = setupAndRenderHook();

    // E
    await waitFor(() => {
      return result.current.locations.status === 'success';
    });

    // V
    if (result.current.locations.status !== 'success') {
      throw new Error('expected locations to be successfully loaded');
    }
    const value = result.current.locations.value;
    // Keyed by the location id (objectId), not by the bucket location name.
    expect(Object.keys(value)).toEqual(['95dbedf5-9888-11ec-8565-1ac2af7d1e53']);
    const usEast1 = value['95dbedf5-9888-11ec-8565-1ac2af7d1e53'];
    expect(usEast1.name).toBe('us-east-1');
    expect(usEast1.usedCapacity.status).toBe('success');
    // A bucket-only location gets synthesized zero-usage capacity.
    expect(usEast1.usedCapacity).toMatchObject({
      status: 'success',
      value: {
        type: 'hasMetrics',
        usedCapacity: { current: 0, nonCurrent: 0 },
        measuredOn: DEFAULT_METRICS_MESURED_ON,
      },
    });
  });
});

describe('useListLocations depending on the user role', () => {
  const RETRIEVED_ON = new Date('2026-11-06T10:00:00Z');

  beforeEach(() => {
    queryClient.clear();
  });
  afterEach(() => resetUserGroups());

  it('should not fetch the storage usage report for a user without StorageManager or StorageUsageReporter', async () => {
    // S
    mockUserGroups(['PlatformAdmin']);
    const metricsAdapter = new MockedMetricsAdapter();
    const { result, waitFor } = renderHook(
      () => useListLocations({ locationsEndpointsAdapter: new MockedAccountsLocationsAdapter(), metricsAdapter }),
      { wrapper: Wrapper },
    );
    // E
    await waitFor(() => result.current.locations.status === 'success');
    // V
    expect(metricsAdapter.getStorageUsageReport).not.toHaveBeenCalled();
    expect(
      result.current.locations.status === 'success' && result.current.locations.value['us-east-1'].usedCapacity,
    ).toStrictEqual({
      status: 'loading',
    });
  });

  it('should sum the usage of every account per location for a storage usage reporter', async () => {
    // S
    mockUserGroups(['StorageUsageReporter']);
    const metricsAdapter = new MockedMetricsAdapter();
    metricsAdapter.getStorageUsageReport = jest.fn().mockResolvedValue({
      accounts: {
        'account-a': { 'us-east-1': 100, 'artesca-s3-location': 5 },
        'account-b': { 'us-east-1': 20 },
      },
      retrievedOn: RETRIEVED_ON,
    });
    const { result, waitFor } = renderHook(
      () => useListLocations({ locationsEndpointsAdapter: new MockedAccountsLocationsAdapter(), metricsAdapter }),
      { wrapper: Wrapper },
    );
    await new Promise(setImmediate);
    // E
    await waitFor(
      () =>
        result.current.locations.status === 'success' &&
        result.current.locations.value['us-east-1'].usedCapacity.status === 'success',
      { timeout: 3000 },
    );
    // V
    const usedCapacityOf = (name: string) =>
      result.current.locations.status === 'success' && result.current.locations.value[name].usedCapacity;
    expect(usedCapacityOf('us-east-1')).toStrictEqual({
      status: 'success',
      value: { type: 'hasMetrics', usedCapacity: { current: 120, nonCurrent: 0 }, measuredOn: RETRIEVED_ON },
    });
    expect(usedCapacityOf('artesca-s3-location')).toStrictEqual({
      status: 'success',
      value: { type: 'hasMetrics', usedCapacity: { current: 5, nonCurrent: 0 }, measuredOn: RETRIEVED_ON },
    });
    expect(usedCapacityOf('artesca-jaguar-location')).toStrictEqual({
      status: 'success',
      value: { type: 'noMetrics' },
    });
  });
});

describe('storage usage report sharing', () => {
  beforeEach(() => queryClient.clear());

  it('should fetch the storage usage report only once across the accounts and locations lists', async () => {
    // S
    const metricsAdapter = new MockedMetricsAdapter();
    const accounts = renderHook(
      () => useListAccounts({ accessibleAccountsAdapter: new MockedAccessibleAccounts(), metricsAdapter }),
      { wrapper: Wrapper },
    );
    await accounts.waitFor(
      () =>
        accounts.result.current.accounts.status === 'success' &&
        accounts.result.current.accounts.value[0].usedCapacity.status === 'success',
    );
    accounts.unmount();
    // E
    const locations = renderHook(
      () => useListLocations({ locationsEndpointsAdapter: new MockedAccountsLocationsAdapter(), metricsAdapter }),
      { wrapper: Wrapper },
    );
    await locations.waitFor(
      () =>
        locations.result.current.locations.status === 'success' &&
        locations.result.current.locations.value['us-east-1'].usedCapacity.status === 'success',
    );
    await new Promise(setImmediate);
    // V
    expect(metricsAdapter.getStorageUsageReport).toHaveBeenCalledTimes(1);
  });

  it('should keep the used capacity of the last report when refetching it fails', async () => {
    // S
    const metricsAdapter = new MockedMetricsAdapter();
    const { result, waitFor } = renderHook(
      () => useListLocations({ locationsEndpointsAdapter: new MockedAccountsLocationsAdapter(), metricsAdapter }),
      { wrapper: Wrapper },
    );
    await new Promise(setImmediate);
    await waitFor(
      () =>
        result.current.locations.status === 'success' &&
        result.current.locations.value['us-east-1'].usedCapacity.status === 'success',
      { timeout: 3000 },
    );
    metricsAdapter.getStorageUsageReport = jest.fn(() => Promise.reject());
    // E
    await act(() => queryClient.refetchQueries(['storageUsageReport']));
    // V
    expect(queryClient.getQueryState(['storageUsageReport'])?.status).toBe('error');
    expect(result.current).toStrictEqual(genExpectedLocation());
  });

  it('should retry a failed storage usage report only once', async () => {
    // S
    const metricsAdapter = new MockedMetricsAdapter();
    metricsAdapter.getStorageUsageReport = jest.fn(() => Promise.reject());
    const { result, waitFor } = renderHook(
      () => useListLocations({ locationsEndpointsAdapter: new MockedAccountsLocationsAdapter(), metricsAdapter }),
      { wrapper: Wrapper },
    );
    await new Promise(setImmediate);
    // E
    await waitFor(
      () =>
        result.current.locations.status === 'success' &&
        result.current.locations.value['us-east-1'].usedCapacity.status === 'error',
      { timeout: 5000 },
    );
    // V
    expect(metricsAdapter.getStorageUsageReport).toHaveBeenCalledTimes(2);
  });
});
