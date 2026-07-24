import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { LocationType } from '../../../../js/managementClient/api';
import type { LocationInfo } from '../../../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import { theme } from '../../../utils/testUtil';
import { StorageClassSelector } from '../StorageClassSelector';

const mockUseLocationsAndEndpoints = jest.fn();
jest.mock('../../../next-architecture/domain/business/accounts', () => ({
  useLocationsAndEndpoints: () => mockUseLocationsAndEndpoints(),
}));

jest.mock('../../../next-architecture/ui/LocationsEndpointsAdapterProvider', () => ({
  useLocationsEndpointsAdapter: () => ({}),
}));

const locations: LocationInfo[] = [
  {
    id: '1',
    name: 'artesca-s3-location',
    type: LocationType.ScalityArtescaS3V1,
    details: {},
  },
  {
    id: '2',
    name: 'crr-location',
    type: LocationType.ScalityCrrV1,
    details: {},
  },
  {
    id: '3',
    name: 'storage-service',
    type: LocationType.ScalityHdclientV2,
    details: {},
  },
];

const renderSelector = (context: 'replication' | 'lifecycle') =>
  render(
    <ThemeProvider theme={theme}>
      <StorageClassSelector value="" onChange={jest.fn()} context={context} />
    </ThemeProvider>,
  );

describe('StorageClassSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocationsAndEndpoints.mockReturnValue({
      locationsAndEndpoints: { locations },
      status: 'success',
    });
  });

  it('should not offer CRR nor storage service locations for lifecycle transitions', async () => {
    renderSelector('lifecycle');

    await userEvent.click(screen.getByRole('textbox'));

    expect(screen.getByRole('option', { name: 'artesca-s3-location (ARTESCA)' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /crr-location/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /storage-service/ })).not.toBeInTheDocument();
  });

  it('should offer CRR locations as replication destinations', async () => {
    renderSelector('replication');

    await userEvent.click(screen.getByRole('textbox'));

    expect(screen.getByRole('option', { name: 'crr-location (CRR)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'artesca-s3-location (ARTESCA)' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /storage-service/ })).not.toBeInTheDocument();
  });
});
