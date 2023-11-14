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
} from './mutations';
import { NewWrapper, TEST_API_BASE_URL } from '../react/utils/testUtil';
import {
  GET_VEEAM_IMMUTABLE_POLICY,
  SYSTEM_XML_CONTENT,
  VEEAM_IMMUTABLE_POLICY_NAME,
  VEEAM_XML_PREFIX,
} from '../react/ui-elements/Veeam/VeeamConstants';

//Subject Under Testing
const SUT = jest.fn();
const instanceId = 'a5c1ad24-27a2-4aaf-a609-26b708729363';
const accountName = 'Veeam-Account';
const accountNameAlreadyExist = 'Veeam-Account-Error';
const accountEmail = 'veeam12@scality.com';
const accountId = '749861052561';
const bucketName = 'Veeam-Bucket';
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

const server = setupServer(
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
        ctx.xml(`
      <AttachUserPolicyResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
        <ResponseMetadata>
          <RequestId>2e30c3c68e45ad7122f7</RequestId>
        </ResponseMetadata>
      </AttachUserPolicyResponse>;
      `),
      );
    }
  }),
  // putBucketTagging
  rest.put(`${TEST_API_BASE_URL}/${bucketName}`, (req, res, ctx) => {
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
);

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
});
