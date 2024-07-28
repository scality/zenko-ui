import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import {
  ACCOUNT_ID,
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
import { debug } from 'jest-preview';

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
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    const params = new URLSearchParams(req.body);
    console.log(req.body);

    if (params.get('Action') === 'GetRolesForWebIdentity') {
      const TEST_ACCOUNT = 'Test Account';
      const TEST_ACCOUNT_CREATION_DATE = '2022-03-18T12:51:44Z';
      return res(
        ctx.json({
          IsTruncated: false,
          Accounts: [
            {
              Name: TEST_ACCOUNT,
              CreationDate: TEST_ACCOUNT_CREATION_DATE,
              Roles: [
                {
                  Name: 'storage-manager-role',
                  Arn: `arn:aws:iam::${ACCOUNT_ID}:role/scality-internal/storage-manager-role`,
                },
              ],
            },
          ],
        }),
      );
    }
  }),
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
