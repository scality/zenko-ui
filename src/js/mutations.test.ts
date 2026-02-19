import { act, renderHook } from '@testing-library/react-hooks';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { GET_VEEAM_IMMUTABLE_POLICY, VEEAM_IMMUTABLE_POLICY_NAME, VEEAM_XML_PREFIX } from '../react/ISV/constants';
import { NewWrapper, TEST_API_BASE_URL } from '../react/utils/testUtil';
import { INSTANCE_ID } from './mock/managementClientMSWHandlers';
import {
  useAddCertificateToZenkoConfigurationMutation,
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateEndpointMutation,
  useCreateIAMUserMutation,
  useCreateOrAddBucketToPolicyMutation,
  useCreatePolicyMutation,
  useCreateUserAccessKeyMutation,
  useEnableSOSAPIMutation,
  usePatchZenkoConfigurationMutation,
  useToggleTLSVerificationMutation,
  useWaitForRunningConfigurationVersionToBeUpdated,
} from './mutations';

//Subject Under Testing
const SUT = jest.fn();
export const PolicySUT = jest.fn();
const instanceId = INSTANCE_ID;
const accountName = 'Veeam';
const accountNameAlreadyExist = 'Veeam-Account-Error';
const accountEmail = 'veeam12@scality.com';
const accountId = '749861052561';
export const bucketName = 'veeam';
const bucketNameWithErrorTriggered = 'Veeam-Bucket-Error';
const userName = 'Veeam-User';
const userNameWithErrorTriggered = 'Veeam-User-Error';
const locationName = 'us-east-1';
const hostname = 's3.scality.com';
const hostnameWithErrorTriggered = 's3.veeam-error.com';
const _tagSet = [
  {
    Key: 'X-Scality-Usecase',
    Value: 'Veeam 12',
  },
];
const veeamPolicyName = `${VEEAM_IMMUTABLE_POLICY_NAME}-${bucketName}`;
const veeamPolicyArn = `arn:aws:iam::${accountId}:policy/${veeamPolicyName}`;
const policyNameWithErrorTriggered = `${VEEAM_IMMUTABLE_POLICY_NAME}-${bucketNameWithErrorTriggered}`;
const veeamObjectKey = `${VEEAM_XML_PREFIX}/system.xml`;

const getLatestInstanceStatusFailingMock = () =>
  rest.get(`${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`, (_req, res, ctx) => {
    return res(ctx.status(500));
  });

const getLatestInstanceStatusMock = (runningConfigurationVersion: number = 1) =>
  rest.get(`${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        metrics: {
          cpu: {
            idle: 119998230,
            nice: 1140,
            sys: 8083540,
            user: 35370130,
          },
          'crr-schedule': {
            states: {
              'eu-cloud-1': 'enabled',
              'val-9464-location': 'enabled',
            },
          },
          'crr-stats': {
            backlog: {},
            completions: {},
            failures: {},
            pending: {},
            stalled: {},
            throughput: {},
            byLocation: {
              'eu-cloud-1': {
                backlog: {},
                completions: {},
                failures: {},
                pending: {},
                throughput: {},
              },
              'val-9464-location': {
                backlog: {},
                completions: {},
                failures: {},
                pending: {},
                throughput: {},
              },
            },
          },
          'data-disk-usage': {
            available: 89988096,
            free: 92085248,
            total: 95762432,
          },
          'ingest-schedule': {},
          'ingest-stats': {
            completions: {},
            pending: {},
            throughput: {},
          },
          'item-counts': {
            bucketList: [
              {
                isVersioned: true,
                location: 'us-east-1',
                name: 'test',
                ownerCanonicalId: 'eae2600b0c0cfbdcae63eb13b501814668d747e136e16f68092709a23fc77422',
              },
            ],
            buckets: 1,
            dataManaged: {
              byLocation: {
                '22f31240-4bd3-11ee-98b3-1e5b6f897bc7': {
                  curr: 39472026504,
                  prev: 10256254,
                },
                'df6098b2-56cd-11ee-815e-f65a3b964922': {
                  curr: 1859580,
                },
              },
              total: {
                curr: 39473886084,
                prev: 10256254,
              },
            },
            objects: 47835,
            versions: 12,
          },
          'md-disk-usage': {
            available: 73761554432,
            free: 73761554432,
            total: 213578133504,
          },
          memory: {
            free: 11772411904,
            total: 33065947136,
          },
        },
        state: {
          capabilities: {
            locationTypeCephRadosGW: true,
            locationTypeDigitalOcean: true,
            locationTypeHyperdriveV2: true,
            locationTypeLocal: true,
            locationTypeNFS: true,
            locationTypeS3Custom: true,
            locationTypeSproxyd: true,
            managedLifecycle: true,
            managedLifecycleTransition: true,
            preferredReadLocation: true,
            s3cIngestLocation: true,
            secureChannel: true,
            secureChannelOptimizedPath: true,
          },
          ipAddress: '10.233.9.177',
          lastSeen: '2023-12-01T12:59:02.407Z',
          latestConfigurationOverlay: {
            version: runningConfigurationVersion,
          },
          runningConfigurationVersion,
          serverVersion: 'ref: refs/heads/development/8.8\n',
        },
      }),
    );
  });

export const getVeeamMutationHandler = () => [
  // create endpoint
  rest.post(`${TEST_API_BASE_URL}/api/v1/config/${instanceId}/endpoint`, (req, res, ctx) => {
    SUT(req.body);
    //@ts-expect-error
    if (req.body.hostname === hostnameWithErrorTriggered) {
      return res(ctx.status(400));
    }
    return res(
      ctx.status(201),
      ctx.json({
        hostname,
        locationName,
      }),
    );
  }),
  // createConfigurationOverlayUser
  rest.post(`${TEST_API_BASE_URL}/api/v1/config/${instanceId}/user`, (req, res, ctx) => {
    SUT(req.body);
    //@ts-expect-error
    if (req.body.userName === accountNameAlreadyExist) {
      return res(ctx.status(409));
    }
    return res(
      ctx.status(201),
      ctx.json({
        arn: `arn:aws:iam::${accountId}:/${accountName}/`,
        canonicalId: '9151880e827fdab2e7b3d7e686e4ea0546d207d012b877f31631affdffea47f2',
        createDate: '2023-11-16T09:58:27.000Z',
        email: accountEmail,
        id: accountId,
        userName: accountName,
      }),
    );
  }),
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    //@ts-expect-error
    const params = new URLSearchParams(req.body);
    SUT(params);
    // Assume Role
    if (params.get('Action') === 'AssumeRoleWithWebIdentity') {
      return res(
        ctx.status(200),
        ctx.xml(`
<AssumeRoleWithWebIdentityResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
  <AssumeRoleWithWebIdentityResult>
    <AssumedRoleUser>
      <Arn>arn:aws:sts::${accountId}:assumed-role/storage-manager-role/ui-9160673b-2c2a-4a6f-a1ef-a3cb6ce25d7f</Arn>
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
    if (params.get('Action') === 'CreateUser') {
      if (params.get('UserName') === userNameWithErrorTriggered) {
        return res(
          ctx.status(409),
          ctx.xml(
            `<ErrorResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/"><Error><Code>EntityAlreadyExists</Code><Message>The request was rejected because it attempted to create a resource that already exists.</Message></Error><RequestId>b2ea3e6ea54a80d77dac</RequestId></ErrorResponse>`,
          ),
        );
      }
      return res(
        ctx.status(201),
        ctx.xml(
          `<CreateUserResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/"><CreateUserResult><User><Path>/</Path><UserName>${userName}</UserName><UserId>UW9BTCBLM9N473PUUIS696OHWPY6M3F0</UserId><Arn>arn:aws:iam::${accountId}:user/${userName}</Arn></User></CreateUserResult><ResponseMetadata><RequestId>b66a35b0ce42b10ceca6</RequestId></ResponseMetadata></CreateUserResponse>`,
        ),
      );
    }
    if (params.get('Action') === 'CreatePolicy') {
      if (params.get('PolicyName') === policyNameWithErrorTriggered) {
        return res(
          ctx.status(400),
          ctx.xml(
            `<ErrorResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/"><Error><Code>ValidationError</Code><Message>The specified value is invalid.</Message></Error><RequestId>caeb1338404c9f821a2d</RequestId></ErrorResponse>`,
          ),
        );
      }
      PolicySUT(decodeURIComponent(req.body as string));
      return res(
        ctx.status(200),
        ctx.xml(
          `<CreatePolicyResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/"><CreatePolicyResult><Policy><PolicyName>${veeamPolicyName}</PolicyName><DefaultVersionId>v1</DefaultVersionId><PolicyId>WFICM40ZMHLDXLXIK2843MZODDN6VD96</PolicyId><Path>/</Path><Arn>arn:aws:iam::${accountId}:policy/${veeamPolicyName}</Arn><IsAttachable>true</IsAttachable><AttachmentCount>0</AttachmentCount><CreateDate>2023-11-15T14:29:06Z</CreateDate><UpdateDate>2023-11-15T14:29:06Z</UpdateDate></Policy></CreatePolicyResult><ResponseMetadata><RequestId>ac51e21fa045a30fbf5a</RequestId></ResponseMetadata></CreatePolicyResponse>`,
        ),
      );
    }
    if (params.get('Action') === 'AttachUserPolicy') {
      if (params.get('UserName') === userNameWithErrorTriggered) {
        return res(
          ctx.status(400),
          ctx.xml(
            `<ErrorResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/"><Error><Code>ValidationError</Code><Message>The specified value is invalid.</Message></Error><RequestId>caeb1338404c9f821a2d</RequestId></ErrorResponse>`,
          ),
        );
      }
      return res(
        ctx.status(200),
        ctx.xml(`
        <AttachUserPolicyResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
          <ResponseMetadata>
            <RequestId>2e30c3c68e45ad7122f7</RequestId>
          </ResponseMetadata>
        </AttachUserPolicyResponse>;
        `),
      );
    }
    if (params.get('Action') === 'CreateAccessKey') {
      if (params.get('UserName') === userNameWithErrorTriggered) {
        return res(
          ctx.status(400),
          ctx.xml(
            `<ErrorResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/"><Error><Code>ValidationError</Code><Message>The specified value is invalid.</Message></Error><RequestId>caeb1338404c9f821a2d</RequestId></ErrorResponse>`,
          ),
        );
      }
      return res(
        ctx.xml(`
        <CreateAccessKeyResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
          <CreateAccessKeyResult>
            <AccessKey>
              <UserName>${userName}</UserName>
              <AccessKeyId>AKIAIOSFODNN7EXAMPLE</AccessKeyId>
              <Status>Active</Status>
              <SecretAccessKey>wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY</SecretAccessKey>
              <CreateDate>2023-11-15T14:29:06Z</CreateDate>
            </AccessKey>
          </CreateAccessKeyResult>
          <ResponseMetadata>
            <RequestId>2e30c3c68e45ad7122f7</RequestId>
          </ResponseMetadata>
        </CreateAccessKeyResponse>;
        `),
      );
    }
  }),

  rest.put(`${TEST_API_BASE_URL}/${bucketName}`, (req, res, ctx) => {
    // putBucketTagging
    if (req.url.searchParams.get('tagging') === '') {
      SUT(req.body);
      return res(
        ctx.xml(`
        <PutBucketTaggingResponse xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
          <ResponseMetadata>
            <RequestId>2e30c3c68e45ad7122f7</RequestId>
          </ResponseMetadata>
        </PutBucketTaggingResponse>;
        `),
      );
    }
    //create bucket
    return res(ctx.status(200));
  }),
  rest.put(`${TEST_API_BASE_URL}/${bucketNameWithErrorTriggered}`, (req, res, ctx) => {
    if (req.url.searchParams.get('tagging') === '') {
      SUT(req.body);
      return res(
        ctx.status(404),
        ctx.xml(
          `<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist.</Message><Resource></Resource><RequestId>a60426d7934a9fa05118</RequestId></Error>`,
        ),
      );
    }
  }),
  // putObject
  rest.put(`${TEST_API_BASE_URL}/${bucketName}/${VEEAM_XML_PREFIX}`, (req, res, ctx) => {
    SUT(req.body);
    return res(ctx.status(200));
  }),
  rest.put(`${TEST_API_BASE_URL}/${bucketName}/${VEEAM_XML_PREFIX}/capacity.xml`, (req, res, ctx) => {
    SUT(req.body);
    return res(ctx.status(200));
  }),
  rest.put(`${TEST_API_BASE_URL}/${bucketName}/${veeamObjectKey}`, (req, res, ctx) => {
    SUT(req.body);
    return res(ctx.status(200));
  }),
  rest.put(`${TEST_API_BASE_URL}/${bucketNameWithErrorTriggered}/${veeamObjectKey}`, (req, res, ctx) => {
    SUT(req.body);
    return res(
      ctx.status(404),
      ctx.xml(
        `<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist.</Message><Resource></Resource><RequestId>a60426d7934a9fa05118</RequestId></Error>`,
      ),
    );
  }),
];
const server = setupServer(getLatestInstanceStatusMock(), ...getVeeamMutationHandler());

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  SUT.mockClear();
});
afterAll(() => server.close());

describe('mutations', () => {
  it('should return an error when failed to retrieve current running version while taking the reference', async () => {
    //Setup
    server.use(getLatestInstanceStatusFailingMock());
    const { result, waitFor } = renderHook(() => useWaitForRunningConfigurationVersionToBeUpdated(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    act(() => {
      result.current.setReferenceVersion({});
    });
    //Verify
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });

  it('should return an error when failed to retrieve current running version while waiting for the new version', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useWaitForRunningConfigurationVersionToBeUpdated(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    act(() => {
      result.current.setReferenceVersion({
        onRefTaken: () => {
          server.use(getLatestInstanceStatusFailingMock());
          result.current.waitForRunningConfigurationVersionToBeUpdated();
        },
      });
    });
    //Verify
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });

  it('should wait for running configuration to be updated', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useWaitForRunningConfigurationVersionToBeUpdated(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    act(() => {
      result.current.setReferenceVersion({
        onRefTaken: () => {
          server.use(getLatestInstanceStatusMock(2));
          result.current.waitForRunningConfigurationVersionToBeUpdated();
        },
      });
    });
    //Verify
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
  });

  it('should handle the useCreateEndpointMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useCreateEndpointMutation(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    result.current?.mutate({
      instanceId,
      hostname,
      locationName,
    });
    //Verify
    await waitFor(() => {
      expect(result.current?.isSuccess).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith({
      hostname,
      locationName,
    });
  });
  it('should handle the error case of useCreateEndpointMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useCreateEndpointMutation(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    result.current?.mutate({
      instanceId,
      hostname: hostnameWithErrorTriggered,
      locationName,
    });
    //Verify
    await waitFor(() => {
      expect(result.current?.isError).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith({
      hostname: hostnameWithErrorTriggered,
      locationName,
    });
  });
  it('should handle the useCreateAccountMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useCreateAccountMutation(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    const user = {
      userName: accountName,
      email: accountEmail,
    };
    result.current?.mutate({ user, instanceId });
    //Verify
    await waitFor(() => {
      expect(result.current?.isSuccess).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(user);
  });
  it('should handle the error case of useCreateAccountMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useCreateAccountMutation(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    const user = {
      userName: accountNameAlreadyExist,
      email: accountEmail,
    };
    result.current?.mutate({ user, instanceId });
    //Verify
    await waitFor(() => {
      expect(result.current?.isError).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(user);
  });
  it('should handle the useCreateUserMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useCreateIAMUserMutation(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    result.current.mutate({ userName });
    //Verify
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(
      new URLSearchParams({
        Action: 'CreateUser',
        UserName: userName,
        Version: '2010-05-08',
      }),
    );
  });
  it('should handle the error case of useCreateUserMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useCreateIAMUserMutation(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    result.current.mutate({ userName: userNameWithErrorTriggered });
    //Verify
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(
      new URLSearchParams({
        Action: 'CreateUser',
        UserName: userNameWithErrorTriggered,
        Version: '2010-05-08',
      }),
    );
  });
  it('should handle the useCreatePolicyMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useCreatePolicyMutation(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    result.current.mutate({
      policyName: veeamPolicyName,
      policyDocument: GET_VEEAM_IMMUTABLE_POLICY(bucketName),
    });
    //Verify
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(
      new URLSearchParams({
        Action: 'CreatePolicy',
        PolicyDocument: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'VisualEditor0',
              Effect: 'Allow',
              Action: [
                's3:GetBucketLocation',
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:GetBucketVersioning',
                's3:GetBucketObjectLockConfiguration',
                's3:ListBucketVersions',
                's3:GetObjectVersion',
                's3:GetObjectRetention',
                's3:GetObjectLegalHold',
                's3:PutObjectRetention',
                's3:PutObjectLegalHold',
                's3:DeleteObjectVersion',
              ],
              Resource: [`arn:aws:s3:::${bucketName}/*`, `arn:aws:s3:::${bucketName}`],
            },
            {
              Sid: 'VisualEditor1',
              Effect: 'Allow',
              Action: ['s3:ListAllMyBuckets', 's3:ListBucket'],
              Resource: '*',
            },
          ],
        }),
        PolicyName: veeamPolicyName,
        Version: '2010-05-08',
      }),
    );
  });
  it('should handle the error case of useCreatePolicyMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useCreatePolicyMutation(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    result.current.mutate({
      policyName: `${VEEAM_IMMUTABLE_POLICY_NAME}-${bucketNameWithErrorTriggered}`,
      policyDocument: GET_VEEAM_IMMUTABLE_POLICY(bucketNameWithErrorTriggered),
    });
    //Verify
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(
      new URLSearchParams({
        Action: 'CreatePolicy',
        PolicyDocument: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'VisualEditor0',
              Effect: 'Allow',
              Action: [
                's3:GetBucketLocation',
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:GetBucketVersioning',
                's3:GetBucketObjectLockConfiguration',
                's3:ListBucketVersions',
                's3:GetObjectVersion',
                's3:GetObjectRetention',
                's3:GetObjectLegalHold',
                's3:PutObjectRetention',
                's3:PutObjectLegalHold',
                's3:DeleteObjectVersion',
              ],
              Resource: [
                `arn:aws:s3:::${bucketNameWithErrorTriggered}/*`,
                `arn:aws:s3:::${bucketNameWithErrorTriggered}`,
              ],
            },
            {
              Sid: 'VisualEditor1',
              Effect: 'Allow',
              Action: ['s3:ListAllMyBuckets', 's3:ListBucket'],
              Resource: '*',
            },
          ],
        }),
        PolicyName: policyNameWithErrorTriggered,
        Version: '2010-05-08',
      }),
    );
  });
  it('should handle the useAttachPolicyToUserMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useAttachPolicyToUserMutation(), { wrapper: NewWrapper() });
    //Exercise
    result.current.mutate({ userName, policyArn: veeamPolicyArn });
    //Verify
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(
      new URLSearchParams({
        Action: 'AttachUserPolicy',
        PolicyArn: veeamPolicyArn,
        UserName: userName,
        Version: '2010-05-08',
      }),
    );
  });
  it('should handle the error case of useAttachPolicyToUserMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useAttachPolicyToUserMutation(), { wrapper: NewWrapper() });
    //Exercise
    result.current.mutate({
      userName: userNameWithErrorTriggered,
      policyArn: veeamPolicyArn,
    });
    //Verify
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(
      new URLSearchParams({
        Action: 'AttachUserPolicy',
        PolicyArn: veeamPolicyArn,
        UserName: userNameWithErrorTriggered,
        Version: '2010-05-08',
      }),
    );
  });
  it('should handle the useCreateUserAccessKeyMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useCreateUserAccessKeyMutation(), { wrapper: NewWrapper() });
    //Exercise
    result.current.mutate({ userName });
    //Verify
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(
      new URLSearchParams({
        Action: 'CreateAccessKey',
        UserName: userName,
        Version: '2010-05-08',
      }),
    );
  });
  it('should handle the error case of useCreateUserAccessKeyMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => useCreateUserAccessKeyMutation(), { wrapper: NewWrapper() });
    //Exercise
    result.current.mutate({ userName: userNameWithErrorTriggered });
    //Verify
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(
      new URLSearchParams({
        Action: 'CreateAccessKey',
        UserName: userNameWithErrorTriggered,
        Version: '2010-05-08',
      }),
    );
  });

  // ==========================================================================
  // Shared test utilities for Zenko configuration mutations
  // ==========================================================================

  const createDeploymentLifecycleMocks = (generation: number = 1) => {
    return {
      patchSuccess: {
        ok: true,
        json: () => Promise.resolve({ status: 'Success' }),
      },
      deploymentInProgress: {
        ok: true,
        json: () =>
          Promise.resolve({
            metadata: { generation },
            status: {
              observedGeneration: generation,
              conditions: [
                { type: 'Available', status: 'False' },
                {
                  type: 'DeploymentInProgress',
                  status: 'True',
                  lastTransitionTime: new Date().toISOString(),
                },
                { type: 'DeploymentFailure', status: 'False' },
              ],
            },
          }),
      },
      deploymentComplete: {
        ok: true,
        json: () =>
          Promise.resolve({
            metadata: { generation },
            status: {
              observedGeneration: generation,
              conditions: [
                { type: 'Available', status: 'True' },
                { type: 'DeploymentInProgress', status: 'False' },
                { type: 'DeploymentFailure', status: 'False' },
              ],
            },
          }),
      },
      runtimeConfigWithVeeamProxy: {
        ok: true,
        json: () =>
          Promise.resolve({
            spec: {
              selfConfiguration: {
                proxy: {
                  veeam: { cloudserverEndpoint: 'http://localhost:8000' },
                },
              },
            },
          }),
      },
      runtimeConfigWithoutVeeamProxy: {
        ok: true,
        json: () =>
          Promise.resolve({
            spec: {
              selfConfiguration: {},
            },
          }),
      },
    };
  };

  const setupZenkoMutationMocks = () => {
    jest.spyOn(require('@scality/module-federation'), 'useShellHooks').mockImplementation(() => ({
      useAuth: () => ({
        getToken: jest.fn().mockResolvedValue('test-token'),
      }),
      useConfigRetriever: () => ({
        retrieveConfiguration: jest.fn().mockReturnValue({
          spec: {
            selfConfiguration: {
              url: 'https://test-url',
            },
          },
        }),
      }),
    }));

    jest
      .spyOn(require('../react/next-architecture/ui/ConfigProvider'), 'useDeployedMetalk8sInstances')
      .mockImplementation(() => [{ name: 'test-instance' }]);
  };

  describe('usePatchZenkoConfigurationMutation', () => {
    let mockFetch: jest.Mock;
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
      mockFetch = jest.fn();
      global.fetch = mockFetch;
      setupZenkoMutationMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
      jest.restoreAllMocks();
    });

    it('should successfully patch Zenko configuration with polling', async () => {
      jest.useFakeTimers();

      const mocks = createDeploymentLifecycleMocks(5);
      mockFetch
        .mockResolvedValueOnce(mocks.patchSuccess)
        .mockResolvedValueOnce(mocks.deploymentInProgress)
        .mockResolvedValue(mocks.deploymentComplete);

      const { result } = renderHook(
        () =>
          usePatchZenkoConfigurationMutation((args: { testValue: string }) =>
            JSON.stringify([
              {
                op: 'add',
                path: '/spec/test',
                value: args.testValue,
              },
            ]),
          ),
        {
          wrapper: NewWrapper(),
        },
      );

      let mutationPromise: unknown;

      await act(async () => {
        mutationPromise = result.current.mutateAsync({ testValue: 'test' });
      });

      // Advance timers to allow polling iterations to complete
      // Each iteration has a 1000ms setTimeout
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      await mutationPromise;

      jest.useRealTimers();

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isError).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('artesca-data');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual([
        {
          op: 'add',
          path: '/spec/test',
          value: 'test',
        },
      ]);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            status: 'Failure',
            message: 'Operation failed',
          }),
      });

      const { result } = renderHook(
        () =>
          usePatchZenkoConfigurationMutation(() => JSON.stringify([{ op: 'add', path: '/spec/test', value: 'test' }])),
        {
          wrapper: NewWrapper(),
        },
      );

      let error: unknown;
      await act(async () => {
        try {
          await result.current.mutateAsync(undefined);
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(result.current.isError).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout when resource synchronization takes too long', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn) => fn()) as unknown as typeof global.setTimeout;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'Success' }),
        })
        .mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              metadata: { generation: 6 },
              status: {
                observedGeneration: 5,
                conditions: [
                  { type: 'Available', status: 'True' },
                  { type: 'DeploymentInProgress', status: 'True' },
                ],
              },
            }),
        });

      const { result } = renderHook(() => useEnableSOSAPIMutation(), {
        wrapper: NewWrapper(),
      });

      let error: unknown;
      await act(async () => {
        try {
          await result.current.mutateAsync(undefined);
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(result.current.isError).toBe(true);
      const errorMessage = String(error);
      expect(errorMessage).toContain('timed out');

      global.setTimeout = originalSetTimeout;
    });
  });

  // ==========================================================================
  // Tests for useEnableSOSAPIMutation with additionalPollCondition
  // ==========================================================================

  describe('useEnableSOSAPIMutation with veeam proxy check', () => {
    let mockFetch: jest.Mock;
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
      mockFetch = jest.fn();
      global.fetch = mockFetch;
      setupZenkoMutationMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
      jest.restoreAllMocks();
    });

    it('should succeed when veeam proxy appears in runtime config', async () => {
      jest.useFakeTimers();

      const mocks = createDeploymentLifecycleMocks(5);
      mockFetch
        .mockResolvedValueOnce(mocks.patchSuccess)
        .mockResolvedValueOnce(mocks.deploymentInProgress)
        .mockResolvedValueOnce(mocks.deploymentComplete)
        .mockResolvedValueOnce(mocks.runtimeConfigWithVeeamProxy);

      const { result } = renderHook(() => useEnableSOSAPIMutation(), {
        wrapper: NewWrapper(),
      });

      let mutationPromise: unknown;
      await act(async () => {
        mutationPromise = result.current.mutateAsync(undefined);
      });

      for (let i = 0; i < 5; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      await mutationPromise;

      jest.useRealTimers();

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isError).toBe(false);

      const patchCall = mockFetch.mock.calls.find(([, options]) => options?.method === 'PATCH');
      expect(patchCall).toBeDefined();
      expect(JSON.parse(patchCall[1].body)).toEqual([
        {
          op: 'replace',
          path: '/spec/veeamSosApi',
          value: { enable: true },
        },
      ]);

      const runtimeConfigCall = mockFetch.mock.calls.find(([url]) => url.includes('runtime-app-configuration'));
      expect(runtimeConfigCall).toBeDefined();
    });

    it('should timeout when veeam proxy never appears', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => fn()) as unknown as typeof global.setTimeout;

      const mocks = createDeploymentLifecycleMocks(5);
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('runtime-app-configuration')) {
          return Promise.resolve(mocks.runtimeConfigWithoutVeeamProxy);
        }
        if (url.includes('artesca-data')) {
          return Promise.resolve(mocks.deploymentComplete);
        }
        return Promise.resolve(mocks.patchSuccess);
      });

      const { result } = renderHook(() => useEnableSOSAPIMutation(), {
        wrapper: NewWrapper(),
      });

      let error: unknown;
      await act(async () => {
        try {
          await result.current.mutateAsync(undefined);
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(result.current.isError).toBe(true);
      expect(String(error)).toContain('timed out');

      global.setTimeout = originalSetTimeout;
    });

    it('should handle runtime config fetch failure gracefully', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => fn()) as unknown as typeof global.setTimeout;

      const mocks = createDeploymentLifecycleMocks(5);
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('runtime-app-configuration')) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        if (url.includes('artesca-data')) {
          return Promise.resolve(mocks.deploymentComplete);
        }
        return Promise.resolve(mocks.patchSuccess);
      });

      const { result } = renderHook(() => useEnableSOSAPIMutation(), {
        wrapper: NewWrapper(),
      });

      let error: unknown;
      await act(async () => {
        try {
          await result.current.mutateAsync(undefined);
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(result.current.isError).toBe(true);
      expect(String(error)).toContain('timed out');

      global.setTimeout = originalSetTimeout;
    });

    it('should only check veeam proxy after deployment is ready', async () => {
      jest.useFakeTimers();

      const mocks = createDeploymentLifecycleMocks(5);
      const fetchCalls: { url: string; isDeploymentReady: boolean }[] = [];
      let deploymentReadyCount = 0;

      mockFetch.mockImplementation((url: string, options?: { method?: string }) => {
        if (options?.method === 'PATCH') {
          return Promise.resolve(mocks.patchSuccess);
        }

        if (url.includes('artesca-data') && options?.method === 'GET') {
          const artescaGetCount = fetchCalls.filter((c) => c.url.includes('artesca-data')).length;
          const isReady = artescaGetCount >= 2;
          if (isReady) deploymentReadyCount++;
          fetchCalls.push({ url, isDeploymentReady: isReady });
          return Promise.resolve(isReady ? mocks.deploymentComplete : mocks.deploymentInProgress);
        }

        if (url.includes('runtime-app-configuration')) {
          fetchCalls.push({ url, isDeploymentReady: deploymentReadyCount > 0 });
          return Promise.resolve(mocks.runtimeConfigWithVeeamProxy);
        }

        fetchCalls.push({ url, isDeploymentReady: false });
        return Promise.resolve(mocks.patchSuccess);
      });

      const { result } = renderHook(() => useEnableSOSAPIMutation(), {
        wrapper: NewWrapper(),
      });

      let mutationPromise: unknown;
      await act(async () => {
        mutationPromise = result.current.mutateAsync(undefined);
      });

      for (let i = 0; i < 10; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      await mutationPromise;

      jest.useRealTimers();

      const runtimeConfigCalls = fetchCalls.filter((c) => c.url.includes('runtime-app-configuration'));

      expect(runtimeConfigCalls.length).toBeGreaterThan(0);
      runtimeConfigCalls.forEach((call) => {
        expect(call.isDeploymentReady).toBe(true);
      });
    });

    it('should succeed immediately when deployment is already complete (no redeployment needed)', async () => {
      jest.useFakeTimers();

      const mocks = createDeploymentLifecycleMocks(5);
      mockFetch
        .mockResolvedValueOnce(mocks.patchSuccess)
        // First poll: deployment already complete (operator determined no redeployment needed)
        .mockResolvedValueOnce(mocks.deploymentComplete)
        .mockResolvedValueOnce(mocks.runtimeConfigWithVeeamProxy);

      const { result } = renderHook(() => useEnableSOSAPIMutation(), {
        wrapper: NewWrapper(),
      });

      let mutationPromise: unknown;
      await act(async () => {
        mutationPromise = result.current.mutateAsync(undefined);
      });

      // Only need minimal timer advances since deployment is already complete
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      await mutationPromise;

      jest.useRealTimers();

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isError).toBe(false);

      // Verify the flow: PATCH -> GET (deployment complete) -> GET (runtime config)
      const getCalls = mockFetch.mock.calls.filter(([, options]) => !options?.method || options.method === 'GET');
      // Should have minimal GET calls since deployment was already complete
      expect(getCalls.length).toBeLessThanOrEqual(2);
    });

    it('should return false when instances array is empty', async () => {
      jest
        .spyOn(require('../react/next-architecture/ui/ConfigProvider'), 'useDeployedMetalk8sInstances')
        .mockImplementation(() => []);

      const { result } = renderHook(() => useEnableSOSAPIMutation(), {
        wrapper: NewWrapper(),
      });

      expect(result.current.mutate).toBeDefined();
    });
  });

  // ==========================================================================
  // Tests for hooks that use usePatchZenkoConfigurationMutation
  // These tests focus only on verifying the correct patch is generated,
  // not the polling behavior (which is tested in usePatchZenkoConfigurationMutation)
  // ==========================================================================

  describe('Patch generation for derived mutation hooks', () => {
    let mockFetch: jest.Mock;
    let originalFetch: typeof global.fetch;
    let capturedPatchBody: string | null = null;

    beforeEach(() => {
      originalFetch = global.fetch;
      // Mock fetch to capture the PATCH body and return immediate success
      mockFetch = jest.fn().mockImplementation((_url, options) => {
        if (options?.method === 'PATCH') {
          capturedPatchBody = options.body;
        }
        // Return a rejected promise to stop the mutation early
        // We only care about capturing the patch body
        return Promise.reject(new Error('Test: stopping after patch capture'));
      });
      global.fetch = mockFetch;

      jest.spyOn(require('@scality/module-federation'), 'useShellHooks').mockImplementation(() => ({
        useAuth: () => ({
          getToken: jest.fn().mockResolvedValue('test-token'),
        }),
        useConfigRetriever: () => ({
          retrieveConfiguration: jest.fn().mockReturnValue({
            spec: {
              selfConfiguration: {
                url: 'https://test-url',
              },
            },
          }),
        }),
      }));

      jest
        .spyOn(require('../react/next-architecture/ui/ConfigProvider'), 'useDeployedMetalk8sInstances')
        .mockImplementation(() => [{ name: 'test-instance' }]);
    });

    afterEach(() => {
      global.fetch = originalFetch;
      capturedPatchBody = null;
      jest.restoreAllMocks();
    });

    describe('useEnableSOSAPIMutation', () => {
      it('should generate correct patch for enabling SOS API', async () => {
        const { result } = renderHook(() => useEnableSOSAPIMutation(), {
          wrapper: NewWrapper(),
        });

        await act(async () => {
          try {
            await result.current.mutateAsync(undefined);
          } catch {
            // Expected - we reject to stop early
          }
        });

        expect(JSON.parse(capturedPatchBody!)).toEqual([
          {
            op: 'replace',
            path: '/spec/veeamSosApi',
            value: { enable: true },
          },
        ]);
      });
    });

    describe('useAddCertificateToZenkoConfigurationMutation', () => {
      it('should generate append patch when hasEgress=true and hasExtraCACerts=true', async () => {
        const { result } = renderHook(
          () =>
            useAddCertificateToZenkoConfigurationMutation({
              hasEgress: true,
              hasExtraCACerts: true,
            }),
          { wrapper: NewWrapper() },
        );

        await act(async () => {
          try {
            await result.current.mutateAsync({
              certificate: 'test-cert-content',
            });
          } catch {
            // Expected
          }
        });

        expect(JSON.parse(capturedPatchBody!)).toEqual([
          {
            op: 'add',
            path: '/spec/egress/extraCACerts/-',
            value: { 'ca.crt': 'test-cert-content' },
          },
        ]);
      });

      it('should generate initialize patch when hasEgress=true and hasExtraCACerts=false', async () => {
        const { result } = renderHook(
          () =>
            useAddCertificateToZenkoConfigurationMutation({
              hasEgress: true,
              hasExtraCACerts: false,
            }),
          { wrapper: NewWrapper() },
        );

        await act(async () => {
          try {
            await result.current.mutateAsync({
              certificate: 'test-cert-content',
            });
          } catch {
            // Expected
          }
        });

        expect(JSON.parse(capturedPatchBody!)).toEqual([
          {
            op: 'add',
            path: '/spec/egress/extraCACerts',
            value: [{ 'ca.crt': 'test-cert-content' }],
          },
        ]);
      });

      it('should generate add egress patch when hasEgress=false', async () => {
        const { result } = renderHook(
          () =>
            useAddCertificateToZenkoConfigurationMutation({
              hasEgress: false,
              hasExtraCACerts: false,
            }),
          { wrapper: NewWrapper() },
        );

        await act(async () => {
          try {
            await result.current.mutateAsync({
              certificate: 'test-cert-content',
            });
          } catch {
            // Expected
          }
        });

        expect(JSON.parse(capturedPatchBody!)).toEqual([
          {
            op: 'add',
            path: '/spec/egress',
            value: { extraCACerts: [{ 'ca.crt': 'test-cert-content' }] },
          },
        ]);
      });
    });

    describe('useToggleTLSVerificationMutation', () => {
      it('should generate replace patch when hasEgress=true', async () => {
        const { result } = renderHook(() => useToggleTLSVerificationMutation(true), { wrapper: NewWrapper() });

        await act(async () => {
          try {
            await result.current.mutateAsync({ skipTLSVerify: true });
          } catch {
            // Expected
          }
        });

        expect(JSON.parse(capturedPatchBody!)).toEqual([
          {
            op: 'replace',
            path: '/spec/egress/skipTLSVerify',
            value: true,
          },
        ]);
      });

      it('should generate add egress patch when hasEgress=false', async () => {
        const { result } = renderHook(() => useToggleTLSVerificationMutation(false), { wrapper: NewWrapper() });

        await act(async () => {
          try {
            await result.current.mutateAsync({ skipTLSVerify: false });
          } catch {
            // Expected
          }
        });

        expect(JSON.parse(capturedPatchBody!)).toEqual([
          {
            op: 'add',
            path: '/spec/egress',
            value: { skipTLSVerify: false },
          },
        ]);
      });
    });
  });

  describe('useCreateOrAddBucketToPolicyMutation', () => {
    // biome-ignore lint/suspicious/noImplicitAnyLet: reassigned in beforeEach
    let mockIAMClient;
    // biome-ignore lint/suspicious/noImplicitAnyLet: reassigned in beforeEach
    let mockQueryClient;

    const mockPolicyArn = 'arn:aws:iam::123456789012:policy/test-policy';
    const mockExistingPolicy = {
      Policy: {
        Arn: mockPolicyArn,
        DefaultVersionId: 'v1',
      },
    };

    const createMockPolicyDocument = (resources: string[]) => ({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:GetBucketLocation',
            's3:GetBucketVersioning',
            's3:GetBucketObjectLockConfiguration',
          ],
          Resource: resources,
        },
        {
          Effect: 'Allow',
          Action: ['s3:ListAllMyBuckets', 's3:ListBucket'],
          Resource: '*',
        },
      ],
    });

    beforeEach(() => {
      mockIAMClient = {
        createPolicy: jest.fn().mockResolvedValue({ Policy: { Arn: mockPolicyArn } }),
        listPolicyVersions: jest.fn().mockResolvedValue({
          Versions: [{ VersionId: 'v1', IsDefaultVersion: true }],
        }),
        getPolicyVersion: jest.fn(),
        deletePolicyVersion: jest.fn().mockResolvedValue({}),
        createPolicyVersion: jest.fn().mockResolvedValue({ PolicyVersion: { VersionId: 'v2' } }),
      };

      mockQueryClient = {
        fetchQuery: jest.fn(),
      };

      jest.spyOn(require('../react/IAMProvider'), 'useIAMClient').mockReturnValue(mockIAMClient);
      jest.spyOn(require('react-query'), 'useQueryClient').mockReturnValue(mockQueryClient);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create a new policy when policy does not exist', async () => {
      mockQueryClient.fetchQuery.mockRejectedValue(new Error('NoSuchEntity'));

      const { result, waitFor } = renderHook(() => useCreateOrAddBucketToPolicyMutation(), { wrapper: NewWrapper() });

      const policyDocument = JSON.stringify(
        createMockPolicyDocument(['arn:aws:s3:::test-bucket/*', 'arn:aws:s3:::test-bucket']),
      );

      result.current.mutate({
        policyName: 'test-policy',
        bucketsName: ['test-bucket'],
        isImmutable: false,
        policyArn: mockPolicyArn,
        getPolicy: () => policyDocument,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockIAMClient.createPolicy).toHaveBeenCalledWith('test-policy', policyDocument);
    });

    it('should prevent duplicate resources and handle substring relationships', async () => {
      const existingResources = ['arn:aws:s3:::existing-bucket/*', 'arn:aws:s3:::existing-bucket'];

      mockQueryClient.fetchQuery.mockResolvedValue(mockExistingPolicy);
      mockIAMClient.getPolicyVersion.mockResolvedValue({
        PolicyVersion: {
          Document: encodeURIComponent(JSON.stringify(createMockPolicyDocument(existingResources))),
        },
      });

      const { result, waitFor } = renderHook(() => useCreateOrAddBucketToPolicyMutation(), { wrapper: NewWrapper() });

      // Try to add the same bucket that already exists
      result.current.mutate({
        policyName: 'test-policy',
        bucketsName: ['existing-bucket'],
        isImmutable: false,
        policyArn: mockPolicyArn,
        getPolicy: (buckets) =>
          JSON.stringify(
            createMockPolicyDocument(buckets.flatMap((b) => [`arn:aws:s3:::${b}/*`, `arn:aws:s3:::${b}`])),
          ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify no duplicates were added
      const firstCallDocument = JSON.parse(mockIAMClient.createPolicyVersion.mock.calls[0][1]);
      expect(firstCallDocument.Statement[0].Resource).toEqual(existingResources);
      expect(firstCallDocument.Statement[0].Resource.length).toBe(2);

      // Use different bucket names to test substring logic
      const { result: result2, waitFor: waitFor2 } = renderHook(() => useCreateOrAddBucketToPolicyMutation(), {
        wrapper: NewWrapper(),
      });

      result2.current.mutate({
        policyName: 'test-policy',
        bucketsName: ['existing-bucket-new'],
        isImmutable: false,
        policyArn: mockPolicyArn,
        getPolicy: (buckets) =>
          JSON.stringify(
            createMockPolicyDocument(buckets.flatMap((b) => [`arn:aws:s3:::${b}/*`, `arn:aws:s3:::${b}`])),
          ),
      });

      await waitFor2(() => expect(result2.current.isSuccess).toBe(true));

      // Verify substring relationships are handled correctly (no false duplicates)
      const secondCallDocument = JSON.parse(mockIAMClient.createPolicyVersion.mock.calls[1][1]);
      const resources = secondCallDocument.Statement[0].Resource;

      expect(resources).toContain('arn:aws:s3:::existing-bucket/*');
      expect(resources).toContain('arn:aws:s3:::existing-bucket');
      expect(resources).toContain('arn:aws:s3:::existing-bucket-new/*');
      expect(resources).toContain('arn:aws:s3:::existing-bucket-new');
      expect(resources.length).toBe(4);
    });

    it('should handle Resource as string and add new bucket', async () => {
      // Test both string conversion and adding new bucket in one test
      mockQueryClient.fetchQuery.mockResolvedValue(mockExistingPolicy);
      mockIAMClient.getPolicyVersion.mockResolvedValue({
        PolicyVersion: {
          Document: encodeURIComponent(
            JSON.stringify({
              ...createMockPolicyDocument([]),
              Statement: [
                {
                  ...createMockPolicyDocument([]).Statement[0],
                  Resource: 'arn:aws:s3:::single-bucket/*', // Single string
                },
                createMockPolicyDocument([]).Statement[1],
              ],
            }),
          ),
        },
      });

      const { result, waitFor } = renderHook(() => useCreateOrAddBucketToPolicyMutation(), { wrapper: NewWrapper() });

      result.current.mutate({
        policyName: 'test-policy',
        bucketsName: ['new-bucket'],
        isImmutable: false,
        policyArn: mockPolicyArn,
        getPolicy: (buckets) =>
          JSON.stringify(
            createMockPolicyDocument(buckets.flatMap((b) => [`arn:aws:s3:::${b}/*`, `arn:aws:s3:::${b}`])),
          ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify string was converted to array and new bucket was added
      const calledPolicyDocument = JSON.parse(mockIAMClient.createPolicyVersion.mock.calls[0][1]);
      expect(calledPolicyDocument.Statement[0].Resource).toContain('arn:aws:s3:::single-bucket/*');
      expect(calledPolicyDocument.Statement[0].Resource).toContain('arn:aws:s3:::new-bucket/*');
      expect(calledPolicyDocument.Statement[0].Resource).toContain('arn:aws:s3:::new-bucket');
    });

    it('should handle policy version limit', async () => {
      mockQueryClient.fetchQuery.mockResolvedValue({
        ...mockExistingPolicy,
        Policy: { ...mockExistingPolicy.Policy, DefaultVersionId: 'v5' },
      });

      // Mock 5 versions (AWS limit)
      mockIAMClient.listPolicyVersions.mockResolvedValue({
        Versions: [
          { VersionId: 'v1', IsDefaultVersion: false },
          { VersionId: 'v2', IsDefaultVersion: false },
          { VersionId: 'v3', IsDefaultVersion: false },
          { VersionId: 'v4', IsDefaultVersion: false },
          { VersionId: 'v5', IsDefaultVersion: true },
        ],
      });

      mockIAMClient.getPolicyVersion.mockResolvedValue({
        PolicyVersion: {
          Document: encodeURIComponent(JSON.stringify(createMockPolicyDocument([]))),
        },
      });

      const { result, waitFor } = renderHook(() => useCreateOrAddBucketToPolicyMutation(), { wrapper: NewWrapper() });

      result.current.mutate({
        policyName: 'test-policy',
        bucketsName: ['test-bucket'],
        isImmutable: false,
        policyArn: mockPolicyArn,
        getPolicy: (buckets) =>
          JSON.stringify(
            createMockPolicyDocument(buckets.flatMap((b) => [`arn:aws:s3:::${b}/*`, `arn:aws:s3:::${b}`])),
          ),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify oldest non-default version was deleted
      expect(mockIAMClient.deletePolicyVersion).toHaveBeenCalledWith(mockPolicyArn, 'v1');
    });
  });
});
