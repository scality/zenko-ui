import { renderHook } from '@testing-library/react-hooks';
import * as accountsModule from '../../next-architecture/domain/business/accounts';
import * as adapterModule from '../../next-architecture/ui/LocationsEndpointsAdapterProvider';
import { useGetS3ServicePoint } from './useGetS3ServicePoint';

const MOCK_ACCOUNTS_LOCATIONS_ENDPOINTS = {
  accounts: [],
  locations: [],
  endpoints: [
    {
      hostname: 'zenko-cloudserver-replicator',
      locationName: 'us-east-1',
      isBuiltin: true,
    },
    {
      hostname: 's3.test.local',
      locationName: 'us-east-1',
      isBuiltin: false,
    },
  ],
};

describe('useGetS3ServicePoint', () => {
  let mockUseLocationsEndpointsAdapter: jest.SpyInstance;
  let mockUseLocationsAndEndpoints: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocationsEndpointsAdapter = jest.spyOn(adapterModule, 'useLocationsEndpointsAdapter');
    mockUseLocationsAndEndpoints = jest.spyOn(accountsModule, 'useLocationsAndEndpoints');

    mockUseLocationsEndpointsAdapter.mockReturnValue({
      listLocationsAndEndpoints: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return s3 endpoint if there is one', () => {
    mockUseLocationsAndEndpoints.mockReturnValue({
      locationsAndEndpoints: MOCK_ACCOUNTS_LOCATIONS_ENDPOINTS,
      status: 'success',
    });

    const { result } = renderHook(() => useGetS3ServicePoint());
    expect(result.current.s3ServicePoint).toBe('s3.test.local');
  });

  it('should return empty string if there is no s3 endpoint', () => {
    mockUseLocationsAndEndpoints.mockReturnValue({
      locationsAndEndpoints: {
        accounts: [],
        locations: [],
        endpoints: [],
      },
      status: 'success',
    });

    const { result } = renderHook(() => useGetS3ServicePoint());
    expect(result.current.s3ServicePoint).toBe('');
  });

  it('should return empty string if there is no non-builtin endpoint', () => {
    mockUseLocationsAndEndpoints.mockReturnValue({
      locationsAndEndpoints: {
        accounts: [],
        locations: [],
        endpoints: [
          {
            hostname: 'zenko-cloudserver-replicator',
            locationName: 'us-east-1',
            isBuiltin: true,
          },
        ],
      },
      status: 'success',
    });

    const { result } = renderHook(() => useGetS3ServicePoint());
    expect(result.current.s3ServicePoint).toBe('');
  });
});
