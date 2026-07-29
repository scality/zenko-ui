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
  TEST_API_BASE_URL,
  TEST_MANAGEMENT_CLIENT,
  WrapperAsStorageManager,
} from '../../../utils/testUtil';
import { MockedAccountsLocationsAdapter } from '../../adapters/accounts-locations/MockedAccountsLocationsAdapter';
import {
  ACCOUNT_OWN_METRICS,
  DEFAULT_METRICS,
  DEFAULT_METRICS_MESURED_ON,
  MockedMetricsAdapter,
} from '../../adapters/metrics/MockedMetricsAdapter';
import type { Location, LocationsPromiseResult } from '../entities/location';
import type { LatestUsedCapacity } from '../entities/metrics';
import type { PromiseResult } from '../entities/promise';
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
    mockMetricsAdapter.listLocationsLatestUsedCapacity = jest.fn(() => new Promise(() => {}));
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
    mockMetricsAdapter.listLocationsLatestUsedCapacity = jest.fn(() => Promise.reject());
    const { result, waitFor } = setupAndRenderHook(mockAccountAdapter, mockMetricsAdapter);

    await flushPromises();
    // E
    await waitFor(() => {
      return (
        result.current.locations.status === 'success' &&
        result.current.locations.value['artesca-s3-location'].usedCapacity.status === 'error'
      );
    });

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
    const { result, waitFor } = setupAndRenderHook();

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
              value: ACCOUNT_OWN_METRICS,
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
    mockMetricsAdapter.listAccountLocationsLatestUsedCapacity = jest.fn(() => new Promise(() => {}));
    const { result } = setupAndRenderHook(mockAccountAdapter, mockMetricsAdapter);

    // V
    const expectedRes = {
      locations: {
        status: 'loading',
      },
    };
    expect(result.current).toStrictEqual(expectedRes);
  });

  it(`should return error when loading account's locations fail`, async () => {
    // S
    const mockAccountAdapter = new MockedAccountsLocationsAdapter();
    const mockMetricsAdapter = new MockedMetricsAdapter();
    mockMetricsAdapter.listAccountLocationsLatestUsedCapacity = jest.fn(() => Promise.reject());
    const { result, waitFor } = setupAndRenderHook(mockAccountAdapter, mockMetricsAdapter);

    // E
    await waitFor(() => {
      return result.current.locations.status === 'error';
    });

    // V
    const expectedRes = {
      locations: {
        status: 'error',
        title: 'Account Location Metrics Error',
        reason: `Unexpected error while fetching account location's metrics`,
      },
    };
    expect(result.current).toStrictEqual(expectedRes);
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
      value: { type: 'hasMetrics', usedCapacity: { current: 0, nonCurrent: 0 } },
    });
  });
});
