import {
  screen,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import { setupServer } from 'msw/node';
import {
  ENDPOINTS,
  getConfigOverlay,
  LOCATIONS,
  USERS,
} from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../../js/mock/managementClientMSWHandlers';
import {
  TEST_API_BASE_URL,
  mockOffsetSize,
  renderWithCustomRoute,
  renderWithRouterMatch,
} from '../../utils/testUtil';
import Endpoints from '../Endpoints';
import { useArtescaLibrary } from '../../next-architecture/ui/ArtescaLibraryProvider';
import { Route, Routes } from 'react-router';

import { rest } from 'msw';
import userEvent from '@testing-library/user-event';
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
  describe('Empty State', () => {
    beforeEach(() => {
      server.use(
        rest.get(
          `${TEST_API_BASE_URL}/api/v1/config/overlay/view/${INSTANCE_ID}`,
          (req, res, ctx) =>
            res(
              ctx.json({
                browserAccess: { enabled: true },
                endpoints: [],
                instanceId: INSTANCE_ID,
                locations: LOCATIONS,
                replicationStreams: [],
                updatedAt: '2022-04-27T13:18:58Z',
                users: USERS,
                version: 12,
              }),
            ),
        ),
      );
    });
    it('should render Empty State when there are no data services', async () => {
      renderWithRouterMatch(<Endpoints />);
      await waitForElementToBeRemoved(() =>
        screen.getByText('Loading Data Services...'),
      );
      expect(
        screen.getByText(/A list of Data Services will appear here./i),
      ).toBeInTheDocument();
    });
    it('should redirect to the create data service page when the create data service button is clicked', async () => {
      renderWithCustomRoute(
        <Routes>
          <Route path="/" element={<Endpoints />}></Route>
          <Route
            path="/create-dataservice"
            element={<div>Create Data Service</div>}
          ></Route>
        </Routes>,
        '/',
      );
      await waitForElementToBeRemoved(() =>
        screen.getByText('Loading Data Services...'),
      );
      userEvent.click(selectors.createDataServiceButton());
      expect(screen.getByText(/Create Data Service/i)).toBeInTheDocument();
    });
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
