import * as T from '../../../../ui-elements/TableKeyValue';
import {
  reduxMount,
  testTableRow,
  TEST_API_BASE_URL,
  TEST_ROLE_PATH_NAME,
  renderWithRouterMatch,
  renderWithCustomRoute,
  zenkoUITestConfig,
  mockShellHooks,
} from '../../../../utils/testUtil';
import AccountInfo from '../AccountInfo';
import Table from '../../../../ui-elements/TableKeyValue';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { INSTANCE_ID } from '../../../../../js/mock/managementClientMSWHandlers';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { getConfigOverlay } from '../../../../../js/mock/managementClientMSWHandlers';

const server = setupServer(
  getConfigOverlay(zenkoUITestConfig.managementEndpoint, INSTANCE_ID),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const account1 = {
  arn: 'arn1',
  canonicalId: 'canonicalId1',
  CreationDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
  Roles: [],
  email: 'test@email1.com',
  id: '1',
  quotaMax: 1,
  Name: 'bart',
};
const fakeToken = 'xxx-yyy-zzz-token';

const useAuth = mockShellHooks.useAuth;

function testRow(rowWrapper, { key, value, extraCellComponent }) {
  testTableRow(T, rowWrapper, {
    key,
    value,
    extraCellComponent,
  });
}

jest.setTimeout(18000);

describe('AccountInfo', () => {
  beforeEach(() => {
    //@ts-expect-error fix this when you are working on it
    useAuth.mockImplementation(() => {
      return {
        userData: {
          id: 'xxx-yyy-zzzz-id',
          token: 'xxx-yyy-zzz-token',
          username: 'Renard ADMIN',
          email: 'renard.admin@scality.com',
          groups: ['StorageManager', 'user', 'PlatformAdmin'],
        },
        getToken: async () => fakeToken,
      };
    });
  });

  it('should render AccountInfo component', () => {
    reduxMount(<AccountInfo account={account1} />);

    expect(screen.getByRole('table')).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);

    const firstRow = within(rows[0]).getAllByRole('cell');
    expect(firstRow[0]).toHaveTextContent('Account ID');
    expect(firstRow[1]).toHaveTextContent(account1.id);

    const secondRow = within(rows[1]).getAllByRole('cell');
    expect(secondRow[0]).toHaveTextContent('Name');
    expect(secondRow[1]).toHaveTextContent(account1.Name);

    const thirdRow = within(rows[2]).getAllByRole('cell');
    expect(thirdRow[0]).toHaveTextContent('Creation Date');
  });

  it('should not be able to delete an account when not a storage manager', () => {
    //@ts-expect-error fix this when you are working on it
    useAuth.mockImplementation(() => {
      return {
        userData: {
          id: 'xxx-yyy-zzzz-id',
          token: 'xxx-yyy-zzz-token',
          username: 'Renard ADMIN',
          email: 'renard.admin@scality.com',
          groups: ['user', 'PlatformAdmin'],
        },
        getToken: async () => fakeToken,
      };
    });
    //S+E
    renderWithRouterMatch(<AccountInfo account={account1} />, undefined);
    //V
    expect(
      screen.queryByRole('button', { name: /Delete Account/i }),
    ).toBeNull();
  });

  it('should be able to delete an account when user is a storage manager', async () => {
    //S
    const mockedRequestSearchParamsInterceptor = jest.fn();
    server.use(
      rest.delete(
        `${TEST_API_BASE_URL}/api/v1/config/${INSTANCE_ID}/user`,
        (req, res, ctx) => {
          mockedRequestSearchParamsInterceptor(req.url.searchParams.toString());
          return res(ctx.status(200));
        },
      ),
    );

    renderWithCustomRoute(
      <Routes>
        <Route path="/" element={<AccountInfo account={account1} />}></Route>
        <Route path="/accounts" element={<div>Account Page</div>}></Route>
      </Routes>,
      '/',
    );

    //E
    await userEvent.click(
      screen.getByRole('button', { name: /Delete Account/i }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      const params = new URLSearchParams({
        accountName: account1.Name,
        roleName: TEST_ROLE_PATH_NAME,
      }).toString();
      return expect(mockedRequestSearchParamsInterceptor).toHaveBeenCalledWith(
        params,
      );
    });
  });

  it('should display an error message when attempting to delete if there is a bucket attached to the account', async () => {
    //S
    server.use(
      rest.delete(
        `${TEST_API_BASE_URL}/api/v1/config/${INSTANCE_ID}/user`,
        (_, res, ctx) => res(ctx.status(409)),
      ),
    );
    //E
    renderWithRouterMatch(<AccountInfo account={account1} />, undefined);

    await userEvent.click(
      screen.getByRole('button', { name: /Delete Account/i }),
    );

    await userEvent.click(
      within(screen.getByRole('dialog', { name: /Confirmation/i })).getByRole(
        'button',
        { name: /delete/i },
      ),
    );
    //V
    await waitFor(() => {
      expect(
        within(screen.getByRole('dialog', { name: /Error/i })).getByText(
          /Unable to delete the account due to the presence of associated resources./i,
        ),
      ).toBeInTheDocument();
    });
    //E
    await userEvent.click(
      within(screen.getByRole('dialog', { name: /Error/i })).getByRole(
        'button',
        { name: /close/i },
      ),
    );
    //V
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /Error/i }),
      ).not.toBeInTheDocument();
    });
  });
});
