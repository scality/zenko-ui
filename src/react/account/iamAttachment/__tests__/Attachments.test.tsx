import { getByRole, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import router from 'react-router';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
} from '../../../utils/testUtil';
import Attachments from '../Attachments';
import accountSeeds from '../../../../../public/assets/account-seeds.json';

const defaultAccountName = 'account1';
const userName = 'user1';
const policyName = 'backbeat-lifecycle-bp-1';
const defaultPolicyArn = `arn:aws:iam::718643629313:policy/scality-internal/${policyName}`;
const attachedUserName = 'attached-user';
const attachedRoleName = 'attached-role';
const attachedGroupName = 'attached-group';

const tobeAttachedUserName = 'dev1';
const tobeAttachedUserArn = 'arn:aws:iam::718643629313:user/dev1';

const groupName = 'devs';
const groupArn = 'arn:aws:iam::718643629313:group/devs';

const initialMock = (req, res, ctx) => {
  const params = new URLSearchParams(req.body);
  if (params.get('Action') === 'ListUsers') {
    return res(
      ctx.xml(`
    <ListUsersResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
       <ListUsersResult>
         <Users>
           <member>
             <UserId>ANAOQ65XCATLB2KMVXI508ZFXTOK12W5</UserId>
             <Path>/</Path>
             <UserName>${tobeAttachedUserName}</UserName>
             <Arn>${tobeAttachedUserArn}</Arn>
             <CreateDate>2022-07-04T13:34:25Z</CreateDate>
           </member>
         </Users>
         <IsTruncated>false</IsTruncated>
       </ListUsersResult>
       <ResponseMetadata>
         <RequestId>e43fc97c3c4f9895c92e</RequestId>
       </ResponseMetadata>
     </ListUsersResponse>`),
    );
  }
  if (params.get('Action') === 'ListGroups') {
    return res(
      ctx.xml(`
    <ListGroupsResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
<ListGroupsResult>
  <Groups>
    <member>
      <Path>/</Path>
      <GroupName>${groupName}</GroupName>
      <GroupId>N0L8CM7DIHD6YWN8V8796U3PTM8EEB01</GroupId>
      <Arn>${groupArn}</Arn>
      <CreateDate>2022-06-23T12:29:50Z</CreateDate>
    </member>
  </Groups>
  <IsTruncated>false</IsTruncated>
</ListGroupsResult>
<ResponseMetadata>
  <RequestId>99ed69425849972f4e3d</RequestId>
</ResponseMetadata>
</ListGroupsResponse>;
    `),
    );
  }
  if (params.get('Action') === 'AttachUserPolicy') {
    return res(
      ctx.xml(`
    <AttachUserPolicyResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
      <ResponseMetadata>
        <RequestId>2e30c3c68e45ad7122f7</RequestId>
      </ResponseMetadata>
    </AttachUserPolicyResponse>;
    `),
    );
  }
  if (params.get('Action') === 'ListGroupsForUser') {
    return res(
      ctx.xml(`
    <ListGroupsForUserResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
<ListGroupsForUserResult>
  <Groups>
    <member>
      <Path>/</Path>
      <GroupName>${groupName}</GroupName>
      <GroupId>N0L8CM7DIHD6YWN8V8796U3PTM8EEB01</GroupId>
      <Arn>${groupArn}</Arn>
      <CreateDate>2022-06-23T12:29:50Z</CreateDate>
    </member>
  </Groups>
  <IsTruncated>false</IsTruncated>
</ListGroupsForUserResult>
<ResponseMetadata>
  <RequestId>e23e78bd624aba46bb85</RequestId>
</ResponseMetadata>
</ListGroupsForUserResponse>;
    `),
    );
  }

  if (params.get('Action') === 'RemoveUserFromGroup') {
    return res(
      ctx.xml(`
      <RemoveUserFromGroupResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
<ResponseMetadata>
  <RequestId>b6c00e6cc143a8a66b8e</RequestId>
</ResponseMetadata>
</RemoveUserFromGroupResponse>;
      `),
    );
  }
  return res(
    ctx.xml(`
    <ListEntitiesForPolicyResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
        <ListEntitiesForPolicyResult>
            <PolicyRoles>
                <member><RoleName>${attachedRoleName}</RoleName></member>
            </PolicyRoles>
            <PolicyGroups>
                <member><GroupName>${attachedGroupName}</GroupName></member>
            </PolicyGroups>
            <PolicyUsers>
                <member><UserName>${attachedUserName}</UserName></member>
            </PolicyUsers>
            <IsTruncated>false</IsTruncated>
        </ListEntitiesForPolicyResult>
        <ResponseMetadata><RequestId>d5199fe5464489b0f507</RequestId></ResponseMetadata>
    </ListEntitiesForPolicyResponse>
    `),
  );
};
const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/`, initialMock),

  rest.get('http://localhost/account-seeds.json', (req, res, ctx) => {
    return res(ctx.json(accountSeeds));
  }),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 100);
  jest.setTimeout(10_000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const setupPolicyRender = (
  accountName = defaultAccountName,
  policyArn = defaultPolicyArn,
) => {
  jest
    .spyOn(router, 'useRouteMatch')
    .mockReturnValue(
      `/accounts/${accountName}/policies/${policyArn}/attachments`,
    );
  jest.spyOn(router, 'useParams').mockReturnValue({
    policyArn,
  });
  reduxRender(<Attachments />);
};

describe('Policy Attachments', () => {
  it('should render Users, Groups and Roles for Policy Attachments Tabs', () => {
    //S
    setupPolicyRender(defaultAccountName, defaultPolicyArn);

    expect(screen.getByText(`${policyName}`));
    expect(screen.getByRole('tab', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /groups/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /roles/i })).toBeInTheDocument();
  });

  it('should render the attached Users in Users Tab', async () => {
    // S
    setupPolicyRender();
    //E
    await waitFor(() => screen.getByText('Attachment status'));
    //V
    const firstRow = screen.getAllByRole('row')[1];
    expect(
      getByRole(firstRow, 'gridcell', {
        name: /attached-user/i,
      }),
    ).toBeInTheDocument();
    expect(
      getByRole(firstRow, 'button', {
        name: /Remove/i,
      }),
    ).not.toBeDisabled();
  });

  it('should render the attached Groups in Groups Tab', async () => {
    // S
    setupPolicyRender();
    userEvent.click(screen.getByRole('tab', { name: /groups/i }));
    //E
    await waitFor(() => screen.getByText('Attachment status'));
    //V
    const firstRow = screen.getAllByRole('row')[1];
    expect(
      getByRole(firstRow, 'gridcell', {
        name: /attached-group/i,
      }),
    ).toBeInTheDocument();
    expect(
      getByRole(firstRow, 'button', {
        name: /Remove/i,
      }),
    ).not.toBeDisabled();
  });

  it('should render the selected User and clear it after clicking on the Remove button', async () => {
    // S
    setupPolicyRender();

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText('Search by entity name'),
      ).not.toBeDisabled(),
    );
    //E
    userEvent.click(screen.getByPlaceholderText('Search by entity name'));

    await waitFor(() =>
      screen.getByRole('option', {
        name: new RegExp(tobeAttachedUserName, 'i'),
      }),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(tobeAttachedUserName, 'i'),
      }),
    );
    //V
    expect(
      screen.getByRole('row', {
        name: new RegExp(`${tobeAttachedUserName} pending remove`, 'i'),
      }),
    ).toBeInTheDocument();
    const pendingUser = screen.getByRole('row', {
      name: new RegExp(`${tobeAttachedUserName} pending remove`, 'i'),
    });
    expect(
      getByRole(pendingUser, 'button', {
        name: /Remove/i,
      }),
    ).not.toBeDisabled();

    //E
    userEvent.click(
      within(pendingUser).getByRole('button', { name: /remove/i }),
    );

    //V
    expect(
      screen.queryByRole('row', {
        name: new RegExp(`${tobeAttachedUserName} pending remove`, 'i'),
      }),
    ).not.toBeInTheDocument();
    // the save button should be disabled if no change present in the attachment table
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('should render confirmation modal and success status once confirm', async () => {
    // S
    setupPolicyRender();

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText('Search by entity name'),
      ).not.toBeDisabled(),
    );
    //E
    userEvent.click(screen.getByPlaceholderText('Search by entity name'));
    await waitFor(() =>
      screen.getByRole('option', {
        name: new RegExp(tobeAttachedUserName, 'i'),
      }),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(tobeAttachedUserName, 'i'),
      }),
    );
    userEvent.click(screen.getByRole('button', { name: /save/i }));

    //V
    expect(
      screen.getByRole('row', {
        name: new RegExp(
          `attach user ${tobeAttachedUserName} waiting for confirmation`,
          'i',
        ),
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).not.toBeDisabled();

    //E
    userEvent.click(screen.getByRole('button', { name: /confirm/i }));
    //V
    await waitFor(() =>
      expect(screen.getByText('Success')).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /exit/i })).not.toBeDisabled();
  });

  it('should render Retry button if attachment failed', async () => {
    // S
    setupPolicyRender();
    //S
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
        const params = new URLSearchParams(req.body);
        if (params.get('Action') === 'AttachGroupPolicy') {
          return res(ctx.status(500));
        }
        return initialMock(req, res, ctx);
      }),
    );
    //E
    userEvent.click(screen.getByRole('tab', { name: /groups/i }));
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText('Search by entity name'),
      ).not.toBeDisabled(),
    );

    userEvent.click(screen.getByPlaceholderText('Search by entity name'));
    await waitFor(() =>
      screen.getByRole('option', { name: new RegExp(groupName, 'i') }),
    );
    userEvent.click(
      screen.getByRole('option', { name: new RegExp(groupName, 'i') }),
    );
    userEvent.click(screen.getByRole('button', { name: /save/i }));
    userEvent.click(screen.getByRole('button', { name: /confirm/i }));

    //V
    await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /retry/i })).not.toBeDisabled();
  });

  it('should disable the search if list users failed', async () => {
    // S
    setupPolicyRender();

    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
        const params = new URLSearchParams(req.body);
        if (params.get('Action') === 'ListUsers') {
          return res(ctx.status(500));
        }
        return initialMock(req, res, ctx);
      }),
    );

    //V
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText('Search by entity name'),
      ).toBeDisabled(),
    );
  });

  it('should display error message if list attached entities failed', async () => {
    //S
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
        const params = new URLSearchParams(req.body);
        if (params.get('Action') === 'ListEntitiesForPolicy') {
          return res(ctx.status(500));
        }
        return initialMock(req, res, ctx);
      }),
    );
    const policyArn = `arn:aws:iam::718643629313:policy/scality-internal/attached-role`;
    setupPolicyRender(defaultAccountName, policyArn);

    //V

    await waitFor(() =>
      expect(
        screen.getByText(
          'An error occured while loading entities, please retry later and if the error persists, contact your support.',
        ),
      ).toBeInTheDocument(),
    );
  });

  it('should render the attached role in Roles Tab with disabled Removed button for the seeded account', async () => {
    // S
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, initialMock),
      rest.get('http://localhost/account-seeds.json', (req, res, ctx) => {
        return res(
          ctx.json([
            {
              permissionPolicy: {
                policyDocument: {
                  Statement: [],
                  Version: '2012-10-17',
                },
                policyName: 'attached-role',
              },
              role: {
                roleName: 'attached-role',
                trustPolicy: {
                  Statement: [],
                  Version: '2012-10-17',
                },
              },
            },
          ]),
        );
      }),
    );

    const policyArn = `arn:aws:iam::718643629313:policy/scality-internal/attached-role`;
    setupPolicyRender(defaultAccountName, policyArn);

    userEvent.click(screen.getByRole('tab', { name: /roles/i }));
    //E
    await waitFor(() => screen.getByText('Attachment status'));

    //V
    const firstRow = screen.getAllByRole('row')[1];

    expect(
      screen.getByRole('row', { name: /attached-role attached remove/i }),
    ).toBeInTheDocument();
    expect(
      getByRole(firstRow, 'button', {
        name: /Remove/i,
      }),
    ).toBeDisabled();
  });
});

describe('User Attachments', () => {
  const setupRender = () => {
    jest.spyOn(router, 'useRouteMatch').mockReturnValue(null);
    jest.spyOn(router, 'useParams').mockReturnValue({
      IAMUserName: userName,
    });
    reduxRender(<Attachments />);
  };

  it('should render Groups and Policies for User Attachments Tabs', () => {
    //S
    setupRender();
    //V
    expect(screen.getByText(`${userName}`));
    expect(screen.getByRole('tab', { name: /groups/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /policies/i })).toBeInTheDocument();
  });

  it('should remove the user from group after confirmation', async () => {
    //S
    setupRender();
    await waitFor(() => screen.getByRole('tab', { name: /groups/i }));
    await waitFor(() => screen.getByText('Attachment status'));

    //V
    expect(
      screen.getByRole('row', { name: /devs attached remove/i }),
    ).toBeInTheDocument();

    const pendingGroup = screen.getByRole('row', {
      name: /devs attached remove/i,
    });
    expect(
      getByRole(pendingGroup, 'button', {
        name: /Remove/i,
      }),
    ).not.toBeDisabled();

    //E
    userEvent.click(
      within(pendingGroup).getByRole('button', { name: /remove/i }),
    );
    userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(
      screen.getByRole('row', {
        name: /detach group devs waiting for confirmation/i,
      }),
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() =>
      expect(screen.getByText('Success')).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /exit/i })).not.toBeDisabled();
  });
});
