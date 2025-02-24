import { renderHook } from '@testing-library/react-hooks';
import { useGetS3ServicePoint } from './useGetS3ServicePoint';
import { NewWrapper } from '../../../react/utils/testUtil';
import { useAccountsLocationsAndEndpoints } from '../../../react/next-architecture/domain/business/accounts';

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
jest.mock('../../next-architecture/domain/business/accounts', () => ({
  useAccountsLocationsAndEndpoints: jest.fn(),
}));

const mockUseAccountsLocationsAndEndpoints =
  useAccountsLocationsAndEndpoints as jest.Mock;

describe('useGetS3ServicePoint', () => {
  it('should return s3 endpoint if there is one', () => {
    mockUseAccountsLocationsAndEndpoints.mockImplementation(() => {
      return {
        accountsLocationsAndEndpoints: MOCK_ACCOUNTS_LOCATIONS_ENDPOINTS,
        status: 'success',
      };
    });
    const { result } = renderHook(() => useGetS3ServicePoint(), {
      wrapper: NewWrapper(),
    });
    expect(result.current.s3ServicePoint).toBe('s3.test.local');
  });

  it('should return empty string if there is no s3 endpoint', () => {
    mockUseAccountsLocationsAndEndpoints.mockImplementation(() => {
      return {
        accountsLocationsAndEndpoints: {
          accounts: [],
          locations: [],
          endpoints: [],
        },
        status: 'success',
      };
    });
    const { result } = renderHook(() => useGetS3ServicePoint(), {
      wrapper: NewWrapper(),
    });
    expect(result.current.s3ServicePoint).toBe('');
  });
});
