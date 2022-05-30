import * as T from '../../../../ui-elements/TableKeyValue';
import {
  reduxMount,
  reduxRender,
  testTableRow,
  TEST_API_BASE_URL,
  TEST_MANAGEMENT_CLIENT,
  TEST_ROLE_PATH_NAME,
} from '../../../../utils/test';
import AccountInfo from '../AccountInfo';
import Table from '../../../../ui-elements/TableKeyValue';
import { formatDate } from '../../../../utils';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { INSTANCE_ID } from '../../../../actions/__tests__/utils/testUtil';
import { fireEvent, screen, waitFor } from '@testing-library/react';

const server = setupServer();

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
  it('should render AccountInfo component', () => {
    const { component } = reduxMount(<AccountInfo account={account1} />);
    const button = component.find('button#delete-account-btn');
    expect(button).toHaveLength(1);
    expect(button.text()).toContain('Delete Account');
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
    testRow(thirdRow, {
      key: 'Creation Date',
      value: formatDate(new Date(account1.CreationDate)),
    });
    // const fifthRow = rows.at(3);
    // testRow(fifthRow, {
    //   key: 'Root User Email',
    //   value: account1.email,
    //   extraCellComponent: 'Clipboard',
    // });
    // const sixthRow = rows.at(4);
    // testRow(sixthRow, {
    //   key: 'Root User ARN',
    //   value: account1.arn,
    //   extraCellComponent: 'Clipboard',
    // });
  });

  it('should delete account', async () => {
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
    reduxRender(<AccountInfo account={account1} />, {
      auth: { managementClient: TEST_MANAGEMENT_CLIENT },
      instances: { selectedId: INSTANCE_ID },
    });
    //E
    fireEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(mockedRequestSearchParamsInterceptor).toHaveBeenCalled(),
    );
    //V
    expect(mockedRequestSearchParamsInterceptor).toHaveBeenCalledWith(
      new URLSearchParams({
        accountName: account1.Name,
        roleName: TEST_ROLE_PATH_NAME,
      }).toString(),
    );
  });
});
