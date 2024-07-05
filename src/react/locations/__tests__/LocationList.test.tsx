import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import {
  getConfigOverlay,
  getStorageConsumptionMetricsHandlers,
} from '../../../js/mock/managementClientMSWHandlers';
import {
  TEST_API_BASE_URL,
  mockOffsetSize,
  renderWithRouterMatch,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import { LocationsList } from '../LocationsList';

const server = setupServer(
  getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID),
  ...getStorageConsumptionMetricsHandlers(
    zenkoUITestConfig.managementEndpoint,
    INSTANCE_ID,
  ),
  rest.get(
    `${TEST_API_BASE_URL}/api/v1/instance/${INSTANCE_ID}/status`,
    (req, res, ctx) => res(ctx.json({})),
  ),
);

describe('LocationList', () => {
  beforeAll(() => {
    jest.setTimeout(50_000);
    mockOffsetSize(500, 100);
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });
  it('should disable the delete button for default location', async () => {
    //S
    renderWithRouterMatch(<LocationsList />);
    //E
    await waitForElementToBeRemoved(() => [
      ...screen.queryAllByText(/Loading/i),
    ]);
    const defaultArtescaLocationRow = screen.getByRole('row', {
      name: /us-east-1 Storage Service for ARTESCA/i,
    });
    //V
    await waitFor(() => {
      expect(
        within(defaultArtescaLocationRow).getByRole('button', {
          name: /Edit Location/i,
        }),
      ).toBeDisabled();
    });
  });
});
