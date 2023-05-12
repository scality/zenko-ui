import router from 'react-router';
import { screen, waitFor } from '@testing-library/react';
import { List } from 'immutable';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { initialErrorsUIState } from '../../reducers/initialConstants';
import { formatSimpleDate } from '../../utils';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import Accounts from '../Accounts';
import { createMemoryHistory } from 'history';
import { debug } from 'jest-preview';
import {
  ACCOUNT_ID,
  USERS,
  getConfigOverlay,
  getStorageConsumptionMetricsHandlers,
} from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';

const TEST_ACCOUNT =
  USERS.find((user) => user.id === '064609833007')?.userName ?? '';
const TEST_ACCOUNT_CREATION_DATE =
  USERS.find((user) => user.id === '064609833007')?.createDate ?? '';

const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    return res(
      ctx.json({
        IsTruncated: false,
        Accounts: [
          {
            Name: TEST_ACCOUNT,
            CreationDate: (
              <TEST_ACCOUNT_CREATION_DATE></TEST_ACCOUNT_CREATION_DATE>
            ),
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
  getConfigOverlay(zenkoUITestConfig.managementEndpoint, INSTANCE_ID),
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
  it('should list accounts on which user can assume a role', async () => {
    //E
    reduxRender(<Accounts />, {
      oidc: { user: { access_token: 'token' } },
      auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
    });

    //V
    //Wait for account to be loaded
    await waitFor(() => screen.getByText(TEST_ACCOUNT));

    expect(screen.getByText(TEST_ACCOUNT)).toBeInTheDocument();

    expect(
      screen.getByText(formatSimpleDate(new Date(TEST_ACCOUNT_CREATION_DATE))),
    ).toBeInTheDocument();
  });

  it('should list accounts display an error when retrieval of accounts failed', async () => {
    //S
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) =>
        res(ctx.status(500, 'error')),
      ),
    );
    //E
    reduxRender(<Accounts />, {
      uiErrors: initialErrorsUIState,
      networkActivity: {
        counter: 0,
        messages: List.of(),
      },
      oidc: { user: { access_token: 'token' } },
      auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
    });
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
    //E
    reduxRender(<Accounts />, {
      uiErrors: initialErrorsUIState,
      networkActivity: {
        counter: 0,
        messages: List.of(),
      },
      oidc: { user: { access_token: 'token' } },
      auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
    });
    //V

    //Wait for error
    await waitFor(() => screen.getByText(/The provided token has expired./i));

    expect(
      screen.getByText(/The provided token has expired./i),
    ).toBeInTheDocument();
  });

  it('should redirect the user to buckets when no storage manager or storage account owner role can be assumed', async () => {
    //S
    const mockedHistory = createMemoryHistory();
    mockedHistory.replace = jest.fn();
    jest.spyOn(router, 'useHistory').mockReturnValue(mockedHistory);
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
    );

    //E
    reduxRender(<Accounts />, {
      uiErrors: initialErrorsUIState,
      networkActivity: {
        counter: 0,
        messages: List.of(),
      },
      oidc: { user: { access_token: 'token' } },
      auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
    });
    //V
    //Wait for account to be loaded
    await waitFor(() => screen.getByText(TEST_ACCOUNT));

    expect(mockedHistory.replace).toHaveBeenCalledWith('/buckets');
    expect(mockedHistory.replace).toHaveBeenCalledWith('/buckets');

    expect(mockedHistory.replace).toHaveBeenCalledWith('/buckets');
  });

  it('should not redirect the user to buckets when storage manager and no roles can be assumed', async () => {
    //S
    const mockedHistory = createMemoryHistory();
    mockedHistory.replace = jest.fn();
    jest.spyOn(router, 'useHistory').mockReturnValue(mockedHistory);
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

    //E
    reduxRender(<Accounts />, {
      uiErrors: initialErrorsUIState,
      networkActivity: {
        counter: 0,
        messages: List.of(),
      },
      oidc: {
        user: {
          access_token: 'token',
          profile: { groups: 'StorageManager' },
        },
      },
      auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
    });
    //V
    expect(mockedHistory.replace).not.toHaveBeenCalled();
  });

  it('should display Create Account Button for Storage Manager', async () => {
    //E
    reduxRender(<Accounts />, {
      oidc: {
        user: {
          access_token: 'token',
          profile: { groups: ['StorageManager'] },
        },
      },
      auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
    });
    //V
    //Wait for account to be loaded
    await waitFor(() => screen.getByText(TEST_ACCOUNT));

    const createAccountButton = screen.getByRole('button', {
      name: /Create Account/i,
    });
    expect(createAccountButton).toBeInTheDocument();
  });

  it('should hide Create Account Button for Storage Account Owner', async () => {
    //E
    reduxRender(<Accounts />, {
      oidc: {
        user: {
          access_token: 'token',
          profile: { groups: ['StorageAccountOwner'] },
        },
      },
      auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
    });
    //V
    //Wait for account to be loaded
    await waitFor(() => screen.getByText(TEST_ACCOUNT));
    expect(
      screen.queryByRole('button', { name: /Create Account/i }),
    ).not.toBeInTheDocument();
  });
});
