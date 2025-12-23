import { renderHook } from '@testing-library/react-hooks';
import { useGetS3ServicePoint } from './useGetS3ServicePoint';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';

jest.mock('../../next-architecture/domain/business/accounts', () => ({
  useAccountsLocationsAndEndpoints: jest.fn(),
}));

jest.mock('../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider', () => ({
  useAccountsLocationsEndpointsAdapter: jest.fn(() => ({})),
}));

const mockUseAccountsLocationsAndEndpoints =
  useAccountsLocationsAndEndpoints as jest.Mock;

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return s3 endpoint if there is one', () => {
    mockUseAccountsLocationsAndEndpoints.mockReturnValue({
      accountsLocationsAndEndpoints: MOCK_ACCOUNTS_LOCATIONS_ENDPOINTS,
      status: 'success',
    });

    const { result } = renderHook(() => useGetS3ServicePoint());
    expect(result.current.s3ServicePoint).toBe('s3.test.local');
  });

  it('should return empty string if there is no s3 endpoint', () => {
    mockUseAccountsLocationsAndEndpoints.mockReturnValue({
      accountsLocationsAndEndpoints: {
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
    mockUseAccountsLocationsAndEndpoints.mockReturnValue({
      accountsLocationsAndEndpoints: {
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
