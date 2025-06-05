import {
  screen,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import { setupServer } from 'msw/node';
import {
  ENDPOINTS,
  getConfigOverlay,
} from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import {
  TEST_API_BASE_URL,
  mockOffsetSize,
  renderWithRouterMatch,
} from '../../utils/testUtil';
import Endpoints from '../Endpoints';
import { useArtescaLibrary } from '../../next-architecture/ui/ArtescaLibraryProvider';
import { debug } from 'jest-preview';
jest.mock('../../next-architecture/ui/ArtescaLibraryProvider');

const mockUseArtescaLibrary = useArtescaLibrary as jest.Mock;

const server = setupServer(getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID));
describe('Endpoints', () => {
  const selectors = {
    createDataServiceButton: () =>
      screen.getByRole('button', { name: /Create Data Service/ }),
  };
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
    mockOffsetSize(200, 100);
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  it('should render the table with the correct columns', async () => {
    mockUseArtescaLibrary.mockReturnValue({
      useArtescaPlusVeeamDefaultOrOpenMode: () => ({
        artescaPlusVeeamDefaultOrOpenMode: null,
        artescaPlusVeeamDefaultOrOpenModeStatus: 'success',
      }),
    });
    //S
    renderWithRouterMatch(<Endpoints />);
    //E
    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading Data Services...'),
    );
    //V
    expect(screen.getByRole('grid')).toBeInTheDocument();
    const sortedEndpoints = ENDPOINTS.sort((a, b) =>
      a.hostname.localeCompare(b.hostname),
    );
    screen.getAllByRole('row').forEach((row, rowIndex) => {
      if (rowIndex === 0) return; //ignore header
      within(row)
        .getAllByRole('gridcell')
        .forEach((cell, index) => {
          if (index === 0)
            expect(cell).toHaveTextContent(
              sortedEndpoints[rowIndex - 1].hostname,
            );
          if (index === 1)
            expect(cell).toHaveTextContent(
              sortedEndpoints[rowIndex - 1].locationName,
            );
        });
    });
    expect(selectors.createDataServiceButton()).toBeEnabled();
  });
  it('should disable the create data service button in Artesca+Veeam default mode', async () => {
    mockUseArtescaLibrary.mockReturnValue({
      isArtescaLibraryAvailable: true,
      useArtescaPlusVeeamDefaultOrOpenMode: () => ({
        artescaPlusVeeamDefaultOrOpenMode: 'default',
        artescaPlusVeeamDefaultOrOpenModeStatus: 'success',
      }),
    });
    renderWithRouterMatch(<Endpoints />);
    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading Data Services...'),
    );
    expect(selectors.createDataServiceButton()).toBeDisabled();
  });
});
