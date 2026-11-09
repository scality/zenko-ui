import { screen } from '@testing-library/react';
import { useListLocationsForCurrentAccount } from '../../next-architecture/domain/business/locations';
import { mockOffsetSize, mockUserGroups, renderWithRouterMatch, resetUserGroups } from '../../utils/testUtil';
import { AccountLocations } from '../AccountLocations';

jest.mock('../../next-architecture/domain/business/locations', () => ({
  useListLocationsForCurrentAccount: jest.fn(),
}));

describe('AccountLocations', () => {
  beforeAll(() => mockOffsetSize(500, 100));
  beforeEach(() => {
    jest.mocked(useListLocationsForCurrentAccount).mockReturnValue({
      locations: {
        status: 'success',
        value: {
          'location-id': {
            id: 'location-id',
            name: 'artesca-s3-location',
            type: 'location-scality-artesca-s3-v1',
            details: {},
            usedCapacity: { status: 'unknown' },
          },
        },
      },
    });
  });
  afterEach(() => resetUserGroups());

  it('should show the data used to a storage manager', async () => {
    //E
    renderWithRouterMatch(<AccountLocations />, {});
    //V
    await screen.findByRole('row', { name: /artesca-s3-location/i });
    expect(screen.getByRole('columnheader', { name: /Data Used/i })).toBeInTheDocument();
  });

  it('should not show the data used to a user without StorageManager or StorageUsageReporter', async () => {
    //S
    mockUserGroups(['PlatformAdmin']);
    //E
    renderWithRouterMatch(<AccountLocations />, {});
    //V
    await screen.findByRole('row', { name: /artesca-s3-location/i });
    expect(screen.queryByRole('columnheader', { name: /Data Used/i })).not.toBeInTheDocument();
  });
});
