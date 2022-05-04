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
} from '../../utils/test';
import Accounts from '../Accounts';
import { createMemoryHistory } from 'history';

const TEST_ACCOUNT = 'Test Account';
const TEST_ACCOUNT_CREATION_DATE = '2022-03-18T12:51:44Z';

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
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 100);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Accounts', () => {
  it('should list accounts on which user can assume a role', async () => {
    try {
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
        screen.getByText(
          formatSimpleDate(new Date(TEST_ACCOUNT_CREATION_DATE)),
        ),
      ).toBeInTheDocument();
    } catch (e) {
      console.log(
        'should list accounts display an error when retrieval of accounts failed',
        e,
      );
      throw e;
    }
  });

  it('should list accounts display an error when retrieval of accounts failed', async () => {
    try {
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
    } catch (e) {
      console.log(
        'should list accounts display an error when retrieval of accounts failed',
        e,
      );
      throw e;
    }
  });

  it('should redirect the user to buckets when no storage manager or storage account owner role can be assumed', async () => {
    try {
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

      expect(mockedHistory.replace).toHaveBeenCalledWith('/buckets')
    } catch (e) {
      console.log(
        'should list accounts display an error when retrieval of accounts failed',
        e,
      );
      throw e;
    }
  });
});
