import * as T from '../../../../ui-elements/TableKeyValue';
import {
  reduxMount,
  testTableRow,
  TEST_API_BASE_URL,
  TEST_ROLE_PATH_NAME,
  renderWithRouterMatch,
  renderWithCustomRoute,
  zenkoUITestConfig,
} from '../../../../utils/testUtil';
import AccountInfo from '../AccountInfo';
import Table from '../../../../ui-elements/TableKeyValue';
import { formatDate } from '../../../../utils';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { INSTANCE_ID } from '../../../../actions/__tests__/utils/testUtil';
import { screen, waitFor, within } from '@testing-library/react';
import { useAuth } from '../../../../next-architecture/ui/AuthProvider';
import userEvent from '@testing-library/user-event';
import { Route, Switch } from 'react-router-dom';
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

function testRow(rowWrapper, { key, value, extraCellComponent }) {
  testTableRow(T, rowWrapper, {
    key,
    value,
    extraCellComponent,
  });
}

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
      };
    });
  });

  it('should render AccountInfo component', () => {
    const { component } = reduxMount(<AccountInfo account={account1} />);
    expect(component.find(Table)).toHaveLength(1);
    const rows = component.find(T.Row);
    // TODO: switched from 5 -> 3 because we hide the root user email and arn
    expect(rows).toHaveLength(3);
    const firstRow = rows.first();
    testRow(firstRow, {
      key: 'Account ID',
      value: account1.id,
      extraCellComponent: 'Clipboard',
    });
    const secondRow = rows.at(1);
    testRow(secondRow, {
      key: 'Name',
      value: account1.Name,
      extraCellComponent: 'Clipboard',
    });
    const thirdRow = rows.at(2);
    testRow(
      thirdRow,
      //@ts-expect-error fix this when you are working on it
      {
        key: 'Creation Date',
        value: formatDate(new Date(account1.CreationDate)),
      },
    );
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
      };
    });
    //S+E
    renderWithRouterMatch(<AccountInfo account={account1} />, undefined, {
      instances: { selectedId: INSTANCE_ID },
    });
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
      <Switch>
        <Route exact path="/">
          <AccountInfo account={account1} />
        </Route>
        <Route path="/accounts">
          <div>Account Page</div>
        </Route>
      </Switch>,
      '/',
      {
        instances: { selectedId: INSTANCE_ID },
      },
    );

    //E
    await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));

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

    await waitFor(() => {
      return expect(screen.getByText('Account Page')).toBeInTheDocument();
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
    renderWithRouterMatch(<AccountInfo account={account1} />, undefined, {
      instances: { selectedId: INSTANCE_ID },
    });
    await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
    await userEvent.click(within(screen.getByRole('dialog', { name: /Confirmation/i })).getByRole(
      'button',
      { name: /delete/i },
    ));
    //V
    await waitFor(() => {
      expect(
        within(screen.getByRole('dialog', { name: /Error/i })).getByText(
          /Unable to delete the account due to the presence of associated resources./i,
        ),
      ).toBeInTheDocument();
    });
    //E
    await userEvent.click(within(screen.getByRole('dialog', { name: /Error/i })).getByRole(
      'button',
      { name: /close/i },
    ));
    //V
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /Error/i }),
      ).not.toBeInTheDocument();
    });
  });
});
