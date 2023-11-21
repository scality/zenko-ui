import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { renderHook } from '@testing-library/react-hooks';
import {
  useAttachPolicyToUserMutation,
  useCreateIAMUserMutation,
  useCreateEndpointMutation,
  useCreateAccountMutation,
  useCreatePolicyMutation,
  usePutObjectMutation,
  usePutBucketTaggingMutation,
  useCreateUserAccessKeyMutation,
} from './mutations';
import { NewWrapper, TEST_API_BASE_URL } from '../react/utils/testUtil';
import {
  GET_VEEAM_IMMUTABLE_POLICY,
  SYSTEM_XML_CONTENT,
  VEEAM_IMMUTABLE_POLICY_NAME,
  VEEAM_XML_PREFIX,
} from '../react/ui-elements/Veeam/VeeamConstants';
import { INSTANCE_ID } from '../react/actions/__tests__/utils/testUtil';

//Subject Under Testing
const SUT = jest.fn();
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
const tagSet = [
  {
    Key: 'X-Scality-Usecase',
    Value: 'Veeam 12',
  },
];
const veeamPolicyName = `${VEEAM_IMMUTABLE_POLICY_NAME}-${bucketName}`;
const veeamPolicyArn = `arn:aws:iam::${accountId}:policy/${veeamPolicyName}`;
const policyNameWithErrorTriggered = `${VEEAM_IMMUTABLE_POLICY_NAME}-${bucketNameWithErrorTriggered}`;
const veeamObjectKey = `${VEEAM_XML_PREFIX}/system.xml`;

export const getVeeamMutationHandler = () => [
  // create endpoint
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/config/${instanceId}/endpoint`,
    (req, res, ctx) => {
      SUT(req.body);
      //@ts-ignore
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
    },
  ),
  // createConfigurationOverlayUser
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/config/${instanceId}/user`,
    (req, res, ctx) => {
      SUT(req.body);
      //@ts-ignore
      if (req.body.userName === accountNameAlreadyExist) {
        return res(ctx.status(409));
      }
      return res(
        ctx.status(201),
        ctx.json({
          arn: `arn:aws:iam::${accountId}:/${accountName}/`,
          canonicalId:
            '9151880e827fdab2e7b3d7e686e4ea0546d207d012b877f31631affdffea47f2',
          createDate: '2023-11-16T09:58:27.000Z',
          email: accountEmail,
          id: accountId,
          userName: accountName,
        }),
      );
    },
  ),
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    //@ts-ignore
    const params = new URLSearchParams(req.body);
    SUT(params);
    // Assume Role
    if (params.get('Action') === 'AssumeRoleWithWebIdentity') {
      return res(
        ctx.status(200),
        ctx.xml(`
      <AssumeRoleWithWebIdentityResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/"><AssumeRoleWithWebIdentityResult><AssumedRoleUser><Arn>arn:aws:sts::${accountId}:assumed-role/storage-manager-role/ui-9160673b-2c2a-4a6f-a1ef-a3cb6ce25d7f</Arn><AssumedRoleId>OES3SPDIYW4L92S8K1QE6MINE31LQG04:ui-9160673b-2c2a-4a6f-a1ef-a3cb6ce25d7f</AssumedRoleId></AssumedRoleUser><Credentials><SecretAccessKey>v/0Nq1YMw4nNbvtgQlgi0l6m/PXWjlk1VLmn2I5q</SecretAccessKey><AccessKeyId>72SPRZFF71WPWXXUG6XF</AccessKeyId><SessionToken>eyJzYWx0IjoicVIvVGdIdS9FVjJ4TjN5RmtXSnVLZGE0M0krK0g1L3lFVDU5UkV0enpYYz0iLCJ0YWciOiI4d05WRTIwTlQxWTVKbWtZemo2ZGJ3PT0iLCJjaXBoZXJ0ZXh0IjoiQVNIanI0M0VZc3dzK0QwWDFkVXRXQ2JMbzlFOVZ5SzF5WWt6a21lRjRXOUpCU3hwbmNxS21zWnpIU3ZvYlZEYjNKaDRNTm16bW1yVUd6dTU1bmRwMTk0eTVlVjFSVWMzaHZnSTFxZTRuYmJxNHBPdit5V3VZQ3RtSExUbE5BTHpDK3VhYW1tZDdzWk9BVXNKQlhRcmVHUG5sTFphb0kySTFveXJjbk10QlVpb1AvYnNjNUd6RHFqdTFWMjVQRE9PQWgzM2JFSktHdmorbEoyL2lWV0x5UHBQU1pLZmdZUnd1QjRXczdGaG81dHhaem9uWWhpaG9ocnFtdmFnNUJSNytiN2lGN3ZxZjBVSnFPZXI5Wm9ldDk1dlpqL01qTU04aGhGQXI1MmZnTHpzOHAzVlN3dHV0OENFSTBoVEJJNlVycUY4SWxiUmhFOUtlaHo0cnRiZHRKQzVmVHFRSkVPZWltb0RIbGpZZXZqOVlIZzZPVFhDR2ZhVzRIWDc3T0g5M1BRa0dHc1RCSjVpRTEyZEdYQjhYWWdSM1VackIwUzdQejdLQnpvSUVodTZOWUkrK1NPZ2pwMlFaUmhaWGtkbDdDdU5EMWg2UE9qN2twREY0QXhHbWdwcjBMbmpOdVp1UzJaWlJTck5OZG1WL3B5dWpUM3BtcFNJNUZkNW5Wby9SV1dTSGhoR0FVcWRJS0EyV00xdVJ2TkVFS25rb25keWNuVHRrSHpDVUwrN0RtTXNuL202eTcyZjFReHY2VFQyejRzRVFSUDFhWUcwdnBWSTlXbUpWdW5yTFFVNmxSUmpsb1VFSFVkZ2xCMGd1eTZGZTNYR29YQjdVc1J5UUpxbEJ0elpvdFdkR1AvSjZaMllNODFDSy8zZjJZTXVnNTZlbXQxTmJJZ0hrVWxnaGxpclRsNVdrckVRbG5XTW4zT2dzRk9wMjJKSTV1UGoxSENUMlNhTlBXZEQrY0VCcTZycC9tc1FDOW02Q3prSkMwTWMyclZ0RmdnZitaSEV5dVZvdEVzeUFtY1V5QTdFZzJtY3BXd1pnbHZrYkZQQmI5M2NDN0ZhZGhpNEUzQ0hQbm9BczF5eVNKNkxIOTZZTHJoaXk1Q1h3VWloSTlRdmxuSDNlV3EwaElBZTFGc2N6bThzVWRCTGU2SWlVc3ZJVDlpMjJzcTZnaVpmdld5czVlaU9NZzRQMFBaZCtPK0VDRmdmd3dxdUhYcFdEL1F5RnR1RENVb0xxblNyMU9lOHdCQ2lXNDFYaGtacmEzWTdtVW1QYXlNWTN6MXpOZm1XRllJV0dWZzlBNVFUaUZLWGlZTngxdUtWZGJ3Qk54SmowVmxlTTE4azlDNFR3Z2U3dVYyKzEzcWVkTW5xOUpLa2Uwa1NsNmMxMWM5N1RUbGJ4TUx5YS9WY1JLWkNkbHJaTGZNK0hjSTJWaGdkSzNzWHJIVEN6UENFRC9lMVBRTkg1RVZBVThLRlNHWGEzb1dPWm9VcmlSYlk1L3R5eTQvbHRKTkVhNnV3R2hra0ljR3JLMjltUndkaDJHSE94R1laYmdGL0VVUDYreUs5cjQrVzc5Y1RYc3NRcEpSM1M1bkZpUHE2bHR6NXM1ZlNYalNkcUxSM0gvTVZlcXV6K3RON0czMk1ieW9halZvcVJxcks2WjZIVm1vM3pDZ1M4TURQQk9jVkY3Ymc0QmhXaXFUTjc5a0ZqV0xkWWZSVlB5Qk1VaXBHNmZCcGlBdUZCZEV1S2lLMHBwVkhQNUpZL0h5ZXRBbVgxMzdVK1U5d3prbmw3eXhyOEQ0TkdNL05yaVhBT21hSDN4YVEifQ==</SessionToken><Expiration>2023-11-28T10:16:13Z</Expiration></Credentials><Provider>www.scality.com</Provider></AssumeRoleWithWebIdentityResult><ResponseMetadata><RequestId>8e94c64ebf4486567b0e</RequestId></ResponseMetadata></AssumeRoleWithWebIdentityResponse>`),
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
  rest.put(
    `${TEST_API_BASE_URL}/${bucketNameWithErrorTriggered}`,
    (req, res, ctx) => {
      if (req.url.searchParams.get('tagging') === '') {
        SUT(req.body);
        return res(
          ctx.status(404),
          ctx.xml(
            `<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist.</Message><Resource></Resource><RequestId>a60426d7934a9fa05118</RequestId></Error>`,
          ),
        );
      }
    },
  ),
  // putObject
  rest.put(
    `${TEST_API_BASE_URL}/${bucketName}/${VEEAM_XML_PREFIX}`,
    (req, res, ctx) => {
      SUT(req.body);
      return res(ctx.status(200));
    },
  ),
  rest.put(
    `${TEST_API_BASE_URL}/${bucketName}/${VEEAM_XML_PREFIX}/capacity.xml`,
    (req, res, ctx) => {
      SUT(req.body);
      return res(ctx.status(200));
    },
  ),
  rest.put(
    `${TEST_API_BASE_URL}/${bucketName}/${veeamObjectKey}`,
    (req, res, ctx) => {
      SUT(req.body);
      return res(ctx.status(200));
    },
  ),
  rest.put(
    `${TEST_API_BASE_URL}/${bucketNameWithErrorTriggered}/${veeamObjectKey}`,
    (req, res, ctx) => {
      SUT(req.body);
      return res(
        ctx.status(404),
        ctx.xml(
          `<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchBucket</Code><Message>The specified bucket does not exist.</Message><Resource></Resource><RequestId>a60426d7934a9fa05118</RequestId></Error>`,
        ),
      );
    },
  ),
];
const server = setupServer(...getVeeamMutationHandler());

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  SUT.mockClear();
});
afterAll(() => server.close());

describe('mutations', () => {
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
              Resource: [
                `arn:aws:s3:::${bucketName}/*`,
                `arn:aws:s3:::${bucketName}`,
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
    const { result, waitFor } = renderHook(
      () => useAttachPolicyToUserMutation(),
      { wrapper: NewWrapper() },
    );
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
    const { result, waitFor } = renderHook(
      () => useAttachPolicyToUserMutation(),
      { wrapper: NewWrapper() },
    );
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
  it('should handle the usePutBucketTaggingMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(
      () => usePutBucketTaggingMutation(),
      { wrapper: NewWrapper() },
    );
    //Exercise
    result.current.mutate({ bucketName, tagSet });
    //Verify
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    const bucketTaggingXML =
      '<Tagging xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><TagSet><Tag><Key>X-Scality-Usecase</Key><Value>Veeam 12</Value></Tag></TagSet></Tagging>';
    expect(SUT).toHaveBeenCalledWith(bucketTaggingXML);
  });
  it('should handle the error case of usePutBucketTaggingMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(
      () => usePutBucketTaggingMutation(),
      { wrapper: NewWrapper() },
    );
    //Exercise
    result.current.mutate({ bucketName: bucketNameWithErrorTriggered, tagSet });
    //Verify
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    const bucketTaggingXML =
      '<Tagging xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><TagSet><Tag><Key>X-Scality-Usecase</Key><Value>Veeam 12</Value></Tag></TagSet></Tagging>';
    expect(SUT).toHaveBeenCalledWith(bucketTaggingXML);
  });
  it('should handle the usePutObjectMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => usePutObjectMutation(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    result.current.mutate({
      Bucket: bucketName,
      Key: veeamObjectKey,
      Body: SYSTEM_XML_CONTENT,
    });
    //Verify
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(SYSTEM_XML_CONTENT);
  });
  it('should handle the error case of usePutObjectMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(() => usePutObjectMutation(), {
      wrapper: NewWrapper(),
    });
    //Exercise
    result.current.mutate({
      Bucket: bucketNameWithErrorTriggered,
      Key: veeamObjectKey,
      Body: SYSTEM_XML_CONTENT,
    });
    //Verify
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(SUT).toHaveBeenCalledWith(SYSTEM_XML_CONTENT);
  });
  it('should handle the useCreateUserAccessKeyMutation', async () => {
    //Setup
    const { result, waitFor } = renderHook(
      () => useCreateUserAccessKeyMutation(),
      { wrapper: NewWrapper() },
    );
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
    const { result, waitFor } = renderHook(
      () => useCreateUserAccessKeyMutation(),
      { wrapper: NewWrapper() },
    );
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
});
