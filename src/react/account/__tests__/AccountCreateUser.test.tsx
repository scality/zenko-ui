import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { getConfigOverlay } from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../../js/mock/managementClientMSWHandlers';
import {
  mockOffsetSize,
  renderWithCustomRoute,
  TEST_API_BASE_URL,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import AccountCreateUser from '../AccountCreateUser';
import AccountUserList from '../AccountUserList';

const EXISTING_USER_ID = 'EXISTING_ID';
const EXISTING_USER_NAME = 'existing-user';
const EXISTING_CREATE_DATE = '2022-03-01T08:35:24Z';
const EXISTING_ARN = `arn:aws:iam::123456789:user/${EXISTING_USER_NAME}`;

const NEW_USER_NAME = 'new-user';
const NEW_USER_ID = 'NEW_USER_ID';
const NEW_USER_ARN = `arn:aws:iam::123456789:user/${NEW_USER_NAME}`;

const ACCOUNT_NAME = 'test-account';

let usersDatabase = [
  {
    UserId: EXISTING_USER_ID,
    UserName: EXISTING_USER_NAME,
    Arn: EXISTING_ARN,
    CreateDate: EXISTING_CREATE_DATE,
  },
];

let createUserCalled = false;

const server = setupServer(
  getConfigOverlay(zenkoUITestConfig.managementEndpoint, INSTANCE_ID),

  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    const bodyText = req.body as string;

    if (bodyText.includes('Action=CreateUser')) {
      createUserCalled = true;

      const newUser = {
        UserId: NEW_USER_ID,
        UserName: NEW_USER_NAME,
        Arn: NEW_USER_ARN,
        CreateDate: new Date().toISOString(),
      };
      usersDatabase.push(newUser);

      return res(
        ctx.xml(`
          <CreateUserResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
            <CreateUserResult>
              <User>
                <UserId>${NEW_USER_ID}</UserId>
                <Path>/</Path>
                <UserName>${NEW_USER_NAME}</UserName>
                <Arn>${NEW_USER_ARN}</Arn>
                <CreateDate>${new Date().toISOString()}</CreateDate>
              </User>
            </CreateUserResult>
            <ResponseMetadata>
              <RequestId>test-request-id</RequestId>
            </ResponseMetadata>
          </CreateUserResponse>
        `),
      );
    }

    if (bodyText.includes('Action=ListUsers')) {
      return res(
        ctx.xml(`
          <ListUsersResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
            <ListUsersResult>
              <Users>
                ${usersDatabase
                  .map(
                    (user) => `
                <member>
                  <UserId>${user.UserId}</UserId>
                  <Path>/</Path>
                  <UserName>${user.UserName}</UserName>
                  <Arn>${user.Arn}</Arn>
                  <CreateDate>${user.CreateDate}</CreateDate>
                </member>
                `,
                  )
                  .join('')}
              </Users>
              <IsTruncated>false</IsTruncated>
            </ListUsersResult>
            <ResponseMetadata>
              <RequestId>test-request-id</RequestId>
            </ResponseMetadata>
          </ListUsersResponse>
        `),
      );
    }

    if (bodyText.includes('Action=ListAccessKeys')) {
      return res(
        ctx.xml(`
          <ListAccessKeysResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
            <ListAccessKeysResult>
              <AccessKeyMetadata>
              </AccessKeyMetadata>
              <IsTruncated>false</IsTruncated>
            </ListAccessKeysResult>
            <ResponseMetadata>
              <RequestId>test-request-id</RequestId>
            </ResponseMetadata>
          </ListAccessKeysResponse>
        `),
      );
    }

    if (bodyText.includes('Action=ListAttachedUserPolicies')) {
      return res(
        ctx.xml(`
          <ListAttachedUserPoliciesResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
            <ListAttachedUserPoliciesResult>
              <AttachedPolicies>
              </AttachedPolicies>
              <IsTruncated>false</IsTruncated>
            </ListAttachedUserPoliciesResult>
            <ResponseMetadata>
              <RequestId>test-request-id</RequestId>
            </ResponseMetadata>
          </ListAttachedUserPoliciesResponse>
        `),
      );
    }

    return res(ctx.status(400));
  }),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 100);
});

beforeEach(() => {
  usersDatabase = [
    {
      UserId: EXISTING_USER_ID,
      UserName: EXISTING_USER_NAME,
      Arn: EXISTING_ARN,
      CreateDate: EXISTING_CREATE_DATE,
    },
  ];
  createUserCalled = false;
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => server.close());

describe('AccountCreateUser', () => {
  it('should create user successfully', async () => {
    renderWithCustomRoute(
      <AccountCreateUser />,
      `/accounts/${ACCOUNT_NAME}/create-user`,
    );

    await waitFor(() => screen.getByText('Create a User'));

    const nameInput = screen.getByLabelText(/User name/i);
    fireEvent.change(nameInput, { target: { value: NEW_USER_NAME } });

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createUserCalled).toBe(true);
    });
  });

  it('should show new user in list after creation', async () => {
    renderWithCustomRoute(
      <Routes>
        <Route
          path="accounts/:accountName/users"
          element={
            <div>
              {'User List'}
              <AccountUserList accountName={ACCOUNT_NAME} />
            </div>
          }
        />
        <Route
          path="accounts/:accountName/create-user"
          element={<AccountCreateUser />}
        />
      </Routes>,
      `/accounts/${ACCOUNT_NAME}/users`,
      {
        instances: { selectedId: INSTANCE_ID },
      },
    );

    await waitFor(() => screen.getByText('User List'));

    expect(screen.getByText('User List')).toBeInTheDocument();
    expect(screen.getByText('Create User')).toBeInTheDocument();

    const createUserButton = screen.getByText('Create User');
    fireEvent.click(createUserButton);

    await waitFor(() => screen.getByText('Create a User'));

    const nameInput = screen.getByLabelText(/User name/i);
    fireEvent.change(nameInput, { target: { value: NEW_USER_NAME } });

    const submitButton = screen.getByText('Create');

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => screen.getByText('User List'));

    await waitFor(
      () => {
        expect(screen.getByText('User List')).toBeInTheDocument();
        expect(screen.getByText(NEW_USER_NAME)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(createUserCalled).toBe(true);
  });
});
