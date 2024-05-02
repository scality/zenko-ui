import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from 'react-query';
import { TEST_API_BASE_URL } from '../../../react/utils/testUtil';
import { SelectAccountIAMRole } from '../SelectAccountIAMRole';

import userEvent from '@testing-library/user-event';
import { debug } from 'jest-preview';
import {
  USERS,
  getConfigOverlay,
} from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../../react/actions/__tests__/utils/testUtil';

const testAccountId = '064609833007';

const genFn = (getPayloadFn: jest.Mock) => {
  return rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    //@ts-ignore
    const params = new URLSearchParams(req.body);
    getPayloadFn(params);

    if (params.get('Action') === 'AssumeRoleWithWebIdentity') {
      return res(
        ctx.status(200),
        ctx.xml(`
        <AssumeRoleWithWebIdentityResponse
        xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
        <AssumeRoleWithWebIdentityResult>
          <AssumedRoleUser>
            <Arn>arn:aws:sts::${testAccountId}:assumed-role/storage-manager-role/ui-9160673b-2c2a-4a6f-a1ef-a3cb6ce25d7f</Arn>
            <AssumedRoleId>OES3SPDIYW4L92S8K1QE6MINE31LQG04:ui-9160673b-2c2a-4a6f-a1ef-a3cb6ce25d7f</AssumedRoleId>
          </AssumedRoleUser>
          <Credentials>
            <SecretAccessKey>v/0Nq1YMw4nNbvtgQlgi0l6m/PXWjlk1VLmn2I5q</SecretAccessKey>
            <AccessKeyId>72SPRZFF71WPWXXUG6XF</AccessKeyId>
            <SessionToken>eyJzYWx0IjoicVIvVGdIdS9FVjJ4TjN5RmtXSnVLZGE0M0krK0g1L3lFVDU5UkV0enpYYz0iLCJ0YWciOiI4d05WRTIwTlQxWTVKbWtZemo2ZGJ3PT0iLCJjaXBoZXJ0ZXh0IjoiQVNIanI0M0VZc3dzK0QwWDFkVXRXQ2JMbzlFOVZ5SzF5WWt6a21lRjRXOUpCU3hwbmNxS21zWnpIU3ZvYlZEYjNKaDRNTm16bW1yVUd6dTU1bmRwMTk0eTVlVjFSVWMzaHZnSTFxZTRuYmJxNHBPdit5V3VZQ3RtSExUbE5BTHpDK3VhYW1tZDdzWk9BVXNKQlhRcmVHUG5sTFphb0kySTFveXJjbk10QlVpb1AvYnNjNUd6RHFqdTFWMjVQRE9PQWgzM2JFSktHdmorbEoyL2lWV0x5UHBQU1pLZmdZUnd1QjRXczdGaG81dHhaem9uWWhpaG9ocnFtdmFnNUJSNytiN2lGN3ZxZjBVSnFPZXI5Wm9ldDk1dlpqL01qTU04aGhGQXI1MmZnTHpzOHAzVlN3dHV0OENFSTBoVEJJNlVycUY4SWxiUmhFOUtlaHo0cnRiZHRKQzVmVHFRSkVPZWltb0RIbGpZZXZqOVlIZzZPVFhDR2ZhVzRIWDc3T0g5M1BRa0dHc1RCSjVpRTEyZEdYQjhYWWdSM1VackIwUzdQejdLQnpvSUVodTZOWUkrK1NPZ2pwMlFaUmhaWGtkbDdDdU5EMWg2UE9qN2twREY0QXhHbWdwcjBMbmpOdVp1UzJaWlJTck5OZG1WL3B5dWpUM3BtcFNJNUZkNW5Wby9SV1dTSGhoR0FVcWRJS0EyV00xdVJ2TkVFS25rb25keWNuVHRrSHpDVUwrN0RtTXNuL202eTcyZjFReHY2VFQyejRzRVFSUDFhWUcwdnBWSTlXbUpWdW5yTFFVNmxSUmpsb1VFSFVkZ2xCMGd1eTZGZTNYR29YQjdVc1J5UUpxbEJ0elpvdFdkR1AvSjZaMllNODFDSy8zZjJZTXVnNTZlbXQxTmJJZ0hrVWxnaGxpclRsNVdrckVRbG5XTW4zT2dzRk9wMjJKSTV1UGoxSENUMlNhTlBXZEQrY0VCcTZycC9tc1FDOW02Q3prSkMwTWMyclZ0RmdnZitaSEV5dVZvdEVzeUFtY1V5QTdFZzJtY3BXd1pnbHZrYkZQQmI5M2NDN0ZhZGhpNEUzQ0hQbm9BczF5eVNKNkxIOTZZTHJoaXk1Q1h3VWloSTlRdmxuSDNlV3EwaElBZTFGc2N6bThzVWRCTGU2SWlVc3ZJVDlpMjJzcTZnaVpmdld5czVlaU9NZzRQMFBaZCtPK0VDRmdmd3dxdUhYcFdEL1F5RnR1RENVb0xxblNyMU9lOHdCQ2lXNDFYaGtacmEzWTdtVW1QYXlNWTN6MXpOZm1XRllJV0dWZzlBNVFUaUZLWGlZTngxdUtWZGJ3Qk54SmowVmxlTTE4azlDNFR3Z2U3dVYyKzEzcWVkTW5xOUpLa2Uwa1NsNmMxMWM5N1RUbGJ4TUx5YS9WY1JLWkNkbHJaTGZNK0hjSTJWaGdkSzNzWHJIVEN6UENFRC9lMVBRTkg1RVZBVThLRlNHWGEzb1dPWm9VcmlSYlk1L3R5eTQvbHRKTkVhNnV3R2hra0ljR3JLMjltUndkaDJHSE94R1laYmdGL0VVUDYreUs5cjQrVzc5Y1RYc3NRcEpSM1M1bkZpUHE2bHR6NXM1ZlNYalNkcUxSM0gvTVZlcXV6K3RON0czMk1ieW9halZvcVJxcks2WjZIVm1vM3pDZ1M4TURQQk9jVkY3Ymc0QmhXaXFUTjc5a0ZqV0xkWWZSVlB5Qk1VaXBHNmZCcGlBdUZCZEV1S2lLMHBwVkhQNUpZL0h5ZXRBbVgxMzdVK1U5d3prbmw3eXhyOEQ0TkdNL05yaVhBT21hSDN4YVEifQ==</SessionToken>
            <Expiration>2023-11-28T10:16:13Z</Expiration>
          </Credentials>
          <Provider>www.scality.com</Provider>
        </AssumeRoleWithWebIdentityResult>
        <ResponseMetadata>
          <RequestId>8e94c64ebf4486567b0e</RequestId>
        </ResponseMetadata>
      </AssumeRoleWithWebIdentityResponse>`),
      );
    }
    if (params.get('Action') === 'ListRoles') {
      return res(
        ctx.xml(`
        <ListRolesResponse
        xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
        <ListRolesResult>
          <Roles>
            <member>
              <AssumeRolePolicyDocument>%7B%22Statement%22%3A%5B%7B%22Action%22%3A%22sts%3AAssumeRole%22%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22AWS%22%3A%22arn%3Aaws%3Aiam%3A%3A000000000000%3Auser%2Fscality-internal%2Fbackbeat-gc-1%22%7D%7D%5D%2C%22Version%22%3A%222012-10-17%22%7D</AssumeRolePolicyDocument>
              <Description>undefined</Description>
              <Path>/scality-internal/</Path>
              <RoleName>backbeat-gc-1</RoleName>
              <RoleId>NPP7LHXVP8THSFDX9J58KJED1VKO5WIZ</RoleId>
              <Arn>arn:aws:iam::232853836441:role/scality-internal/backbeat-gc-1</Arn>
              <CreateDate>2024-04-17T16:31:36Z</CreateDate>
            </member>
            <member>
              <AssumeRolePolicyDocument>%7B%22Statement%22%3A%5B%7B%22Action%22%3A%22sts%3AAssumeRole%22%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22AWS%22%3A%22arn%3Aaws%3Aiam%3A%3A000000000000%3Auser%2Fscality-internal%2Fbackbeat-lifecycle-bp-1%22%7D%7D%5D%2C%22Version%22%3A%222012-10-17%22%7D</AssumeRolePolicyDocument>
              <Description>undefined</Description>
              <Path>/scality-internal/</Path>
              <RoleName>backbeat-lifecycle-bp-1</RoleName>
              <RoleId>B5HBXF8G2DQ7Z7N13LJA87JRJ1SU40QS</RoleId>
              <Arn>arn:aws:iam::232853836441:role/scality-internal/backbeat-lifecycle-bp-1</Arn>
              <CreateDate>2024-04-17T16:31:36Z</CreateDate>
            </member>
            <member>
              <AssumeRolePolicyDocument>%7B%22Statement%22%3A%5B%7B%22Action%22%3A%22sts%3AAssumeRole%22%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22AWS%22%3A%22arn%3Aaws%3Aiam%3A%3A000000000000%3Auser%2Fscality-internal%2Fbackbeat-lifecycle-conductor-1%22%7D%7D%5D%2C%22Version%22%3A%222012-10-17%22%7D</AssumeRolePolicyDocument>
              <Description>undefined</Description>
              <Path>/scality-internal/</Path>
              <RoleName>backbeat-lifecycle-conductor-1</RoleName>
              <RoleId>SBPV35W7A65Q5OCCWR1FD203538EELDB</RoleId>
              <Arn>arn:aws:iam::232853836441:role/scality-internal/backbeat-lifecycle-conductor-1</Arn>
              <CreateDate>2024-04-17T16:31:36Z</CreateDate>
            </member>
            <member>
              <AssumeRolePolicyDocument>%7B%22Statement%22%3A%5B%7B%22Action%22%3A%22sts%3AAssumeRole%22%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22AWS%22%3A%22arn%3Aaws%3Aiam%3A%3A000000000000%3Auser%2Fscality-internal%2Fbackbeat-lifecycle-op-1%22%7D%7D%5D%2C%22Version%22%3A%222012-10-17%22%7D</AssumeRolePolicyDocument>
              <Description>undefined</Description>
              <Path>/scality-internal/</Path>
              <RoleName>backbeat-lifecycle-op-1</RoleName>
              <RoleId>WHS10HK95B2PN9RK8UY2D9Z8377F9E5X</RoleId>
              <Arn>arn:aws:iam::232853836441:role/scality-internal/backbeat-lifecycle-op-1</Arn>
              <CreateDate>2024-04-17T16:31:36Z</CreateDate>
            </member>
            <member>
              <AssumeRolePolicyDocument>%7B%22Statement%22%3A%5B%7B%22Action%22%3A%22sts%3AAssumeRole%22%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22AWS%22%3A%22arn%3Aaws%3Aiam%3A%3A000000000000%3Auser%2Fscality-internal%2Fbackbeat-lifecycle-tp-1%22%7D%7D%5D%2C%22Version%22%3A%222012-10-17%22%7D</AssumeRolePolicyDocument>
              <Description>undefined</Description>
              <Path>/scality-internal/</Path>
              <RoleName>backbeat-lifecycle-tp-1</RoleName>
              <RoleId>YSXDD002ETBE0CJEZQYFDAYJQTWOVJ51</RoleId>
              <Arn>arn:aws:iam::232853836441:role/scality-internal/backbeat-lifecycle-tp-1</Arn>
              <CreateDate>2024-04-17T16:31:36Z</CreateDate>
            </member>
            <member>
              <AssumeRolePolicyDocument>%7B%22Statement%22%3A%5B%7B%22Action%22%3A%22sts%3AAssumeRole%22%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22AWS%22%3A%22arn%3Aaws%3Aiam%3A%3A000000000000%3Auser%2Fscality-internal%2Fsorbet-fwd-2%22%7D%7D%5D%2C%22Version%22%3A%222012-10-17%22%7D</AssumeRolePolicyDocument>
              <Description>undefined</Description>
              <Path>/scality-internal/</Path>
              <RoleName>cold-storage-archive-role-2</RoleName>
              <RoleId>DMELLEKK4LI9B3F5EWGTXEMRBKU35R3E</RoleId>
              <Arn>arn:aws:iam::232853836441:role/scality-internal/cold-storage-archive-role-2</Arn>
              <CreateDate>2024-04-17T16:31:36Z</CreateDate>
            </member>
            <member>
              <AssumeRolePolicyDocument>%7B%22Statement%22%3A%5B%7B%22Action%22%3A%22sts%3AAssumeRole%22%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22AWS%22%3A%22arn%3Aaws%3Aiam%3A%3A000000000000%3Auser%2Fscality-internal%2Fsorbet-fwd-2%22%7D%7D%5D%2C%22Version%22%3A%222012-10-17%22%7D</AssumeRolePolicyDocument>
              <Description>undefined</Description>
              <Path>/scality-internal/</Path>
              <RoleName>cold-storage-restore-role-2</RoleName>
              <RoleId>H3Y58C2OQTKRH4M1EBXASEKSLOMEGRI1</RoleId>
              <Arn>arn:aws:iam::232853836441:role/scality-internal/cold-storage-restore-role-2</Arn>
              <CreateDate>2024-04-17T16:31:36Z</CreateDate>
            </member>
            <member>
              <AssumeRolePolicyDocument>%7B%22Statement%22%3A%5B%7B%22Action%22%3A%22sts%3AAssumeRoleWithWebIdentity%22%2C%22Condition%22%3A%7B%22StringEquals%22%3A%7B%22keycloak%3Agroups%22%3A%22100%3A%3ADataConsumer%22%7D%7D%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22Federated%22%3A%22https%3A%2F%2Fui.pod-choco.local%2Fauth%2Frealms%2Fartesca%22%7D%7D%2C%7B%22Action%22%3A%22sts%3AAssumeRoleWithWebIdentity%22%2C%22Condition%22%3A%7B%22StringEquals%22%3A%7B%22keycloak%3Agroups%22%3A%22100%3A%3ADataConsumer%22%7D%7D%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22Federated%22%3A%22https%3A%2F%2F13.48.197.10%3A8443%2Fauth%2Frealms%2Fartesca%22%7D%7D%5D%2C%22Version%22%3A%222012-10-17%22%7D</AssumeRolePolicyDocument>
              <Description>Has S3 read and write accesses to 100 S3 Buckets. Cannot create or delete S3 Buckets.</Description>
              <Path>/scality-internal/</Path>
              <RoleName>data-consumer-role</RoleName>
              <RoleId>YGEX9QWC7RI9KMBQEKS4RA9OND4JZ35U</RoleId>
              <Arn>arn:aws:iam::232853836441:role/scality-internal/data-consumer-role</Arn>
              <CreateDate>2024-04-17T16:31:36Z</CreateDate>
            </member>
            <member>
              <AssumeRolePolicyDocument>%7B%22Statement%22%3A%5B%7B%22Action%22%3A%22sts%3AAssumeRoleWithWebIdentity%22%2C%22Condition%22%3A%7B%22StringEquals%22%3A%7B%22keycloak%3Agroups%22%3A%22100%3A%3AStorageAccountOwner%22%7D%7D%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22Federated%22%3A%22https%3A%2F%2Fui.pod-choco.local%2Fauth%2Frealms%2Fartesca%22%7D%7D%2C%7B%22Action%22%3A%22sts%3AAssumeRoleWithWebIdentity%22%2C%22Condition%22%3A%7B%22StringEquals%22%3A%7B%22keycloak%3Agroups%22%3A%22100%3A%3AStorageAccountOwner%22%7D%7D%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22Federated%22%3A%22https%3A%2F%2F13.48.197.10%3A8443%2Fauth%2Frealms%2Fartesca%22%7D%7D%5D%2C%22Version%22%3A%222012-10-17%22%7D</AssumeRolePolicyDocument>
              <Description>Manages the 100 account (Policies, Users, Roles, Groups).</Description>
              <Path>/scality-internal/</Path>
              <RoleName>storage-account-owner-role</RoleName>
              <RoleId>OYYDW5GLCETHME90KWAZCG5Z8KNZA1OT</RoleId>
              <Arn>arn:aws:iam::232853836441:role/scality-internal/storage-account-owner-role</Arn>
              <CreateDate>2024-04-17T16:31:36Z</CreateDate>
            </member>
            <member>
              <AssumeRolePolicyDocument>%7B%22Statement%22%3A%5B%7B%22Action%22%3A%22sts%3AAssumeRoleWithWebIdentity%22%2C%22Condition%22%3A%7B%22StringEquals%22%3A%7B%22keycloak%3Aroles%22%3A%22StorageManager%22%7D%7D%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22Federated%22%3A%22https%3A%2F%2Fui.pod-choco.local%2Fauth%2Frealms%2Fartesca%22%7D%7D%2C%7B%22Action%22%3A%22sts%3AAssumeRoleWithWebIdentity%22%2C%22Condition%22%3A%7B%22StringEquals%22%3A%7B%22keycloak%3Aroles%22%3A%22StorageManager%22%7D%7D%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22Federated%22%3A%22https%3A%2F%2F13.48.197.10%3A8443%2Fauth%2Frealms%2Fartesca%22%7D%7D%5D%2C%22Version%22%3A%222012-10-17%22%7D</AssumeRolePolicyDocument>
              <Description>Has all permissions and full access to the 100 account resources and manages ARTESCA users.</Description>
              <Path>/scality-internal/</Path>
              <RoleName>storage-manager-role</RoleName>
              <RoleId>YRA3NTDUTWN6DRN76LSSDM6HA22RWBO9</RoleId>
              <Arn>arn:aws:iam::232853836441:role/scality-internal/storage-manager-role</Arn>
              <CreateDate>2024-04-17T16:31:36Z</CreateDate>
            </member>
          </Roles>
          <IsTruncated>false</IsTruncated>
        </ListRolesResult>
        <ResponseMetadata>
          <RequestId>148012f42345b8eb7c29</RequestId>
        </ResponseMetadata>
      </ListRolesResponse>
        `),
      );
    }

    if (params.get('Action') === 'GetRolesForWebIdentity') {
      const TEST_ACCOUNT =
        USERS.find((user) => user.id === testAccountId)?.userName ?? '';
      const TEST_ACCOUNT_CREATION_DATE =
        USERS.find((user) => user.id === testAccountId)?.createDate ?? '';

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
                  Arn: `arn:aws:iam::${testAccountId}:role/scality-internal/storage-manager-role`,
                },
              ],
            },
          ],
        }),
      );
    }
  });
};

const server = setupServer(getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID));

const LocalWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    // In test environnement, we don't want to retry queries
    // because we may test the error case
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('SelectAccountIAMRole', () => {
  const seletors = {
    accountSelect: () => screen.getByText(/select account/i),
    roleSelect: () => screen.getByText(/select role/i),
    selectOption: (name: string | RegExp) =>
      screen.getByRole('option', {
        name: new RegExp(name, 'i'),
      }),
  };
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });
  it('renders with normal props', async () => {
    const getPayloadFn = jest.fn();
    server.use(genFn(getPayloadFn));
    const onChange = jest.fn();
    render(
      <LocalWrapper>
        <SelectAccountIAMRole onChange={onChange} />
      </LocalWrapper>,
    );

    await waitFor(() => {
      expect(seletors.accountSelect()).toBeInTheDocument();
    });

    await userEvent.click(seletors.accountSelect());

    expect(screen.getByText('no-bucket')).toBeInTheDocument();

    await userEvent.click(seletors.selectOption(/no-bucket/i));

    await waitFor(() => {
      expect(seletors.roleSelect()).toBeInTheDocument();
    });

    await userEvent.click(seletors.roleSelect());
    await userEvent.click(seletors.selectOption(/backbeat-gc-1/i));

    const account = {
      assumableRoles: [
        {
          Arn: `arn:aws:iam::${testAccountId}:role/scality-internal/storage-manager-role`,
          Name: 'storage-manager-role',
        },
      ],
      canManageAccount: true,
      canonicalId:
        '1e3492312ab47ab0785e3411824352a8fa8aab68cece94973af04167926b8f2c',
      creationDate: '2022-03-18T12:51:44.000Z',
      id: testAccountId,
      name: 'no-bucket',
      preferredAssumableRoleArn: `arn:aws:iam::${testAccountId}:role/scality-internal/storage-manager-role`,
      usedCapacity: {
        status: 'unknown',
      },
    };
    const role = {
      Arn: 'arn:aws:iam::232853836441:role/scality-internal/backbeat-gc-1',
      AssumeRolePolicyDocument:
        '%7B%22Statement%22%3A%5B%7B%22Action%22%3A%22sts%3AAssumeRole%22%2C%22Effect%22%3A%22Allow%22%2C%22Principal%22%3A%7B%22AWS%22%3A%22arn%3Aaws%3Aiam%3A%3A000000000000%3Auser%2Fscality-internal%2Fbackbeat-gc-1%22%7D%7D%5D%2C%22Version%22%3A%222012-10-17%22%7D',
      CreateDate: new Date('2024-04-17T16:31:36.000Z'),
      Description: 'undefined',
      Path: '/scality-internal/',
      RoleId: 'NPP7LHXVP8THSFDX9J58KJED1VKO5WIZ',
      RoleName: 'backbeat-gc-1',
      Tags: [],
    };
    expect(onChange).toHaveBeenCalledWith(account, role);
  });

  it('renders with default value', async () => {
    const getPayloadFn = jest.fn();
    server.use(genFn(getPayloadFn));
    const onChange = jest.fn();
    render(
      <LocalWrapper>
        <SelectAccountIAMRole
          onChange={onChange}
          defaultValue={{
            accountName: 'no-bucket',
            roleName: 'backbeat-gc-1',
          }}
        />
      </LocalWrapper>,
    );
    await waitFor(() => {
      expect(seletors.accountSelect()).toBeInTheDocument();
    });

    expect(screen.getByText('no-bucket')).toBeInTheDocument();

    debug();
  });

  it('renders with wrong default value', async () => {
    const getPayloadFn = jest.fn();
    server.use(genFn(getPayloadFn));
    const onChange = jest.fn();
    render(
      <LocalWrapper>
        <SelectAccountIAMRole
          onChange={onChange}
          defaultValue={{
            accountName: 'william1',
            roleName: 'backbeat-gc-1',
          }}
        />
      </LocalWrapper>,
    );

    await waitFor(() => {
      expect(seletors.accountSelect()).toBeInTheDocument();
    });

    expect(seletors.accountSelect()).toBeInTheDocument();
  });

  it('renders with hidden account roles', async () => {
    const getPayloadFn = jest.fn();
    server.use(genFn(getPayloadFn));
    const onChange = jest.fn();
    render(
      <LocalWrapper>
        <SelectAccountIAMRole
          onChange={onChange}
          hideAccountRoles={[
            { accountName: 'william', roleName: 'backbeat-gc-1' },
            { accountName: 'no-bucket', roleName: 'data-consumer-role' },
          ]}
        />
      </LocalWrapper>,
    );

    await waitFor(() => {
      expect(seletors.accountSelect()).toBeInTheDocument();
    });

    await userEvent.click(seletors.accountSelect());

    await userEvent.click(seletors.selectOption(/no-bucket/i));

    await waitFor(() => {
      expect(seletors.roleSelect()).toBeInTheDocument();
    });

    await userEvent.click(seletors.roleSelect());
    await userEvent.type(seletors.roleSelect(), 'data-consumer');

    expect(screen.getByText(/no options/i)).toBeInTheDocument();

    
  });
});
