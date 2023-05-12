import { renderHook } from '@testing-library/react-hooks';
import { MockedAccountsLocationsAdapter } from '../../adapters/accounts-locations/MockedAccountsLocationsAdapter';
import {
  DEFAULT_METRICS,
  DEFAULT_METRICS_MESURED_ON,
  MockedMetricsAdapter,
} from '../../adapters/metrics/MockedMetricsAdapter';
import { Location, LocationsPromiseResult } from '../entities/location';
import { LatestUsedCapacity } from '../entities/metrics';
import { PromiseResult } from '../entities/promise';

import {
  useListLocations,
  useListLocationsForCurrentAccount,
} from './locations';
import { QueryClient, QueryClientProvider } from 'react-query';
import { PropsWithChildren } from 'react';
import * as DSRProvider from '../../../DataServiceRoleProvider';
import { LocationTypeKey } from '../../../../types/config';

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
const Wrapper = ({ children }: PropsWithChildren<Record<string, never>>) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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
          locationType: 'location-file-v1',
          name: 'us-east-1',
          objectId: '95dbedf5-9888-11ec-8565-1ac2af7d1e53',
          usedCapacity,
        },
      },
    },
  };
};

describe('useListLocations', () => {
  beforeEach(() => queryClient.clear());

  const setupAndRenderHook = (
    locationsAdapter = new MockedAccountsLocationsAdapter(),
    metricsAdapter = new MockedMetricsAdapter(),
  ) => {
    return {
      ...renderHook(
        () =>
          useListLocations({
            locationsAdapter: locationsAdapter,
            metricsAdapter: metricsAdapter,
          }),
        {
          wrapper: Wrapper,
        },
      ),
      metricsAdapter,
    };
  };

  it('should return the locations with metrics', async () => {
    // S
    const { result, waitFor } = setupAndRenderHook();

    // E
    await waitFor(() => {
      return (
        result.current.locations.status === 'success' &&
        result.current.locations.value['artesca-s3-location'].usedCapacity
          .status === 'success'
      );
    });

    // V
    const expectedRes = genExpectedLocation();
    expect(result.current).toStrictEqual(expectedRes);
  });

  it('should return locations loading', async () => {
    // S
    const mockAccountAdapter = new MockedAccountsLocationsAdapter();
    mockAccountAdapter.listLocations = jest.fn(() => new Promise(() => {}));
    const { result, waitFor } = setupAndRenderHook(mockAccountAdapter);

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
    mockAccountAdapter.listLocations = jest.fn(() => Promise.reject());
    const { result, waitFor } = setupAndRenderHook(mockAccountAdapter);

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
    mockMetricsAdapter.listLocationsLatestUsedCapacity = jest.fn(
      () => new Promise(() => {}),
    );
    const { result, waitFor } = setupAndRenderHook(
      mockAccountAdapter,
      mockMetricsAdapter,
    );

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
    mockMetricsAdapter.listLocationsLatestUsedCapacity = jest.fn(() =>
      Promise.reject(),
    );
    const { result, waitFor } = setupAndRenderHook(
      mockAccountAdapter,
      mockMetricsAdapter,
    );

    // E
    await waitFor(() => {
      return (
        result.current.locations.status === 'success' &&
        result.current.locations.value['artesca-s3-location'].usedCapacity
          .status === 'error'
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
    locationsAdapter = new MockedAccountsLocationsAdapter(),
    metricsAdapter = new MockedMetricsAdapter(),
    accountsAdapter = new MockedAccountsLocationsAdapter(),
  ) => {
    return {
      ...renderHook(
        () =>
          useListLocationsForCurrentAccount({
            locationsAdapter: locationsAdapter,
            metricsAdapter: metricsAdapter,
            accountsAdapter: accountsAdapter,
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
      },
      selectAccountAndRoleRedirectTo: () => {},
    });
    new MockedAccountsLocationsAdapter();
  });

  it('should return only location for current account', async () => {
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
            defaultUsedCapacity,
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
      },
      selectAccountAndRoleRedirectTo: () => {},
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
      selectAccountAndRoleRedirectTo: () => {},
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
    mockMetricsAdapter.listAccountLocationsLatestUsedCapacity = jest.fn(
      () => new Promise(() => {}),
    );
    const { result } = setupAndRenderHook(
      mockAccountAdapter,
      mockMetricsAdapter,
    );

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
    mockMetricsAdapter.listAccountLocationsLatestUsedCapacity = jest.fn(() =>
      Promise.reject(),
    );
    const { result, waitFor } = setupAndRenderHook(
      mockAccountAdapter,
      mockMetricsAdapter,
    );

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
    mockAccountAdapter.listLocations = jest.fn(() => Promise.reject());
    const { result, waitFor } = setupAndRenderHook(
      mockAccountAdapter,
      mockMetricsAdapter,
    );

    // E
    await waitFor(() => {
      return result.current.locations.status === 'error';
    });

    // V
    const expectedRes = {
      locations: {
        status: 'error',
        title: 'Location Error',
        reason: `Unexpected error while fetching location`,
      },
    };
    expect(result.current).toStrictEqual(expectedRes);
  });

  it('should return an error when the location metrics exist but not the location', async () => {
    // S
    jest.spyOn(DSRProvider, 'useCurrentAccount').mockReturnValue({
      account: {
        id: 'account-id-with-orphan-metrics',
        Name: 'Chat',
        Roles: [],
        CreationDate: DEFAULT_METRICS_MESURED_ON,
      },
      selectAccountAndRoleRedirectTo: () => {},
    });
    const { result, waitFor } = setupAndRenderHook();

    // V
    await waitFor(() => {
      return result.current.locations.status === 'error';
    });

    // V
    const expectedRes = {
      locations: {
        status: 'error',
        title: 'Account Not Found Error',
        reason: 'Account account-id-with-orphan-metrics not found',
      },
    };
    expect(result.current).toStrictEqual(expectedRes);
  });
});
