import { screen, waitFor } from '@testing-library/react';
import { List } from 'immutable';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  ACCOUNT_ID,
  USERS,
  getConfigOverlay,
  getStorageConsumptionMetricsHandlers,
} from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import { useAuth } from '../../next-architecture/ui/AuthProvider';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';
import { initialErrorsUIState } from '../../reducers/initialConstants';
import {
  FAKE_TOKEN,
  TEST_API_BASE_URL,
  WrapperAsStorageManager,
  defaultUserData,
  mockOffsetSize,
  reduxRender,
  renderWithRouterMatch,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import Accounts from '../Accounts';

const TEST_ACCOUNT =
  USERS.find((user) => user.id === '064609833007')?.userName ?? '';
const TEST_ACCOUNT_CREATION_DATE =
  USERS.find((user) => user.id === '064609833007')?.createDate ?? '';
const NO_ACCOUNT_MESSAGE = "You don't have any account yet.";

const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
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
                Arn: 'arn:aws:iam::064609833007:role/scality-internal/storage-manager-role',
              },
            ],
          },
        ],
      }),
    );
  }),
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/instance/${INSTANCE_ID}/account/${ACCOUNT_ID}/bucket/bucket/workflow/replication`,
    (req, res, ctx) => {
      return res(ctx.json([]));
    },
  ),
  getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID),
  ...getStorageConsumptionMetricsHandlers(
    zenkoUITestConfig.managementEndpoint,
    INSTANCE_ID,
  ),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 100);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Accounts', () => {
  const selectors = {
    createAccountButton: () =>
      screen.getByRole('button', { name: /Create Account/i }),
    startVeeamConfgurationButton: () =>
      screen.getByRole('button', { name: /Start Configuration for Veeam/i }),
  };

  it('should list accounts on which user can assume a role', async () => {
    //E
    renderWithRouterMatch(<Accounts />);

    //V
    //Wait for account to be loaded
    await waitFor(() => screen.getByText(TEST_ACCOUNT));

    expect(screen.getByText(TEST_ACCOUNT)).toBeInTheDocument();

    expect(screen.getByText('2022-03-18 12:51:44')).toBeInTheDocument();
  });

  it('should list accounts display an error when retrieval of accounts failed', async () => {
    //S
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) =>
        res(ctx.status(500, 'error')),
      ),
    );
    // FIXME Move reduxRender to the new render later
    //E
    reduxRender(<Accounts />);
    //V

    //Wait for error
    await waitFor(() =>
      screen.getByText(/The server is temporarily unavailable./i),
    );

    expect(
      screen.getByText('The server is temporarily unavailable.'),
    ).toBeInTheDocument();
  });

  it('should handle token expired errror correctly', async () => {
    //S
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) =>
        res(
          ctx.status(400),
          ctx.xml(`<ErrorResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
          <Error>
              <Code>ExpiredToken</Code>
              <Message>The provided token has expired.</Message>
          </Error>
          <RequestId>489bb474e54ea9c60e35</RequestId>
      </ErrorResponse>
      `),
        ),
      ),
    );
    // FIXME Move reduxRender to the new render later
    //E
    reduxRender(<Accounts />);
    //V

    //Wait for error
    await waitFor(() => screen.getByText(/The provided token has expired./i));

    expect(
      screen.getByText(/The provided token has expired./i),
    ).toBeInTheDocument();
  });

  it('should not let the user click on account when no storage manager or storage account owner role can be assumed', async () => {
    //S
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) =>
        res(
          ctx.json({
            IsTruncated: false,
            Accounts: [
              {
                Name: TEST_ACCOUNT,
                CreationDate: TEST_ACCOUNT_CREATION_DATE,
                Roles: [
                  {
                    Name: 'another-role',
                    Arn: 'arn:aws:iam::064609833007:role/another-role',
                  },
                ],
              },
            ],
          }),
        ),
      ),
      getConfigOverlay(TEST_API_BASE_URL, 'xyz-instance-id'),
    );

    //E
    renderWithRouterMatch(<Accounts />);
    //V
    //Wait for account to be loaded
    await waitFor(() => screen.getByText(TEST_ACCOUNT));

    expect(
      screen.queryAllByRole('link', {
        name: new RegExp(TEST_ACCOUNT, 'i'),
      }),
    ).toHaveLength(0);
  });

  it('should be able to click on the account have is StorageAccountOwner or StorageManager', async () => {
    //S
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) =>
        res(
          ctx.json({
            IsTruncated: false,
            Accounts: [
              {
                Name: TEST_ACCOUNT,
                CreationDate: TEST_ACCOUNT_CREATION_DATE,
                Roles: [
                  {
                    Name: 'storage-manager-role',
                    Arn: 'arn:aws:iam::064609833007:role/scality-internal/storage-manager-role',
                  },
                ],
              },
            ],
          }),
        ),
      ),
      getConfigOverlay(TEST_API_BASE_URL, 'xyz-instance-id'),
    );

    //E
    renderWithRouterMatch(<Accounts />, undefined, {
      uiErrors: initialErrorsUIState,
      networkActivity: {
        counter: 0,
        messages: List.of(),
      },
      auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
    });

    await waitFor(() => screen.getByText(TEST_ACCOUNT));

    //V
    expect(
      screen.queryAllByRole('link', {
        name: new RegExp(TEST_ACCOUNT, 'i'),
      }),
    ).toHaveLength(1);
  });

  it('should display Create Account Button for Storage Manager', async () => {
    //E
    reduxRender(
      <WrapperAsStorageManager isStorageManager={true}>
        <Accounts />
      </WrapperAsStorageManager>,
      {
        auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
      },
    );
    //V
    //Wait for account to be loaded
    await waitFor(() => screen.getByText(TEST_ACCOUNT));

    const createAccountButton = screen.getByRole('button', {
      name: /Create Account/i,
    });
    expect(createAccountButton).toBeInTheDocument();
    expect(selectors.startVeeamConfgurationButton()).toBeInTheDocument();
  });

  it('should hide Create Account Button for Storage Account Owner', async () => {
    mockUseAuth.mockImplementation(() => {
      return {
        userData: defaultUserData,
        getToken: async () => FAKE_TOKEN,
      };
    });
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
        return res(
          ctx.json({
            IsTruncated: false,
            Accounts: [
              {
                Name: TEST_ACCOUNT,
                CreationDate: TEST_ACCOUNT_CREATION_DATE,
                Roles: [
                  {
                    Name: 'storage-account-owner-role',
                    Arn: 'arn:aws:iam::064609833007:role/scality-internal/storage-account-owner-role',
                  },
                ],
              },
            ],
          }),
        );
      }),
    );

    renderWithRouterMatch(<Accounts />);
    //V
    //Wait for account to be loaded
    await waitFor(() => screen.getByText(TEST_ACCOUNT));
    expect(
      screen.queryByRole('button', { name: /Create Account/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Start Configuration for Veeam/i }),
    ).not.toBeInTheDocument();
  });

  it('should display Veeam Configuration for Veeam User and Storage Manager when there are no accounts', async () => {
    // S
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) =>
        res(
          ctx.json({
            IsTruncated: false,
            Accounts: [],
          }),
        ),
      ),
    );

    mockUseConfig.mockImplementation(() => {
      return {
        ...zenkoUITestConfig,
        iamInternalFQDN: TEST_API_BASE_URL,
        s3InternalFQDN: TEST_API_BASE_URL,
        basePath: '',
        features: ['Veeam'],
      };
    });

    mockUseAuth.mockImplementation(() => {
      return {
        userData: {
          ...defaultUserData,
          roles: ['StorageManager'],
          groups: ['user', 'StorageManager'],
        },
        getToken: async () => FAKE_TOKEN,
      };
    });

    //E
    reduxRender(
      <WrapperAsStorageManager isStorageManager>
        <Accounts />
      </WrapperAsStorageManager>,
      {
        auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
      },
    );

    //V
    await waitFor(() => screen.getByText(NO_ACCOUNT_MESSAGE));

    expect(selectors.createAccountButton()).toBeInTheDocument();
    expect(selectors.startVeeamConfgurationButton()).toBeInTheDocument();
  });
});
