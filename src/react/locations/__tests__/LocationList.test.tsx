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
  TEST_ROLE_PATH_NAME,
} from '../../utils/testUtil';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import { LocationsList } from '../LocationsList';
import { _DataServiceRoleContext } from '../../DataServiceRoleProvider';
import { ReplicationControlProvider } from '../contexts/ReplicationControlContext';

jest.setTimeout(30_000);

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
    //@ts-ignore
    const params = new URLSearchParams(req.body);

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
    const customRole = {
      roleArn: `arn:aws:iam::${ACCOUNT_ID}:role/${TEST_ROLE_PATH_NAME}`,
    };
    
    const Component = () => (
      <_DataServiceRoleContext.Provider
        value={{
          role: customRole,
          setRole: jest.fn(),
          setRolePromise: jest.fn().mockResolvedValue({}),
          assumedRole: undefined,
        }}
      >
        <ReplicationControlProvider>
          <LocationsList />
        </ReplicationControlProvider>
      </_DataServiceRoleContext.Provider>
    );
    
    renderWithRouterMatch(<Component />, {}, {
      auth: {
        config: {
          iamEndpoint: TEST_API_BASE_URL,
        },
        selectedAccount: {
          id: ACCOUNT_ID,
        },
      },
      instances: {
        selectedId: INSTANCE_ID,
      },
    });
    //E

    const loading = await screen.findByText(/Loading/i);

    expect(loading).toBeInTheDocument();

    await waitForElementToBeRemoved(loading, {
      timeout: 1600,
    });

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
