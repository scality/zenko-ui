import { rest } from 'msw';

/**
 * /!\ Prerequisites: Can be changed below /!\
 *   - Account named "pat"
 *   - Bucket name "test"
 */

const ACCOUNT_NAME = 'pat';
const BUCKET_NAME = 'test';

export const getColdStorageHandlers = (baseUrl: string, instanceId: string) => [
  //Config overlay mock below
  rest.get(`${baseUrl}/api/v1/config/overlay/view/${instanceId}`, (req, res, ctx) =>
    res(
      ctx.json({
        browserAccess: { enabled: true },
        endpoints: [
          {
            hostname: 'zenko-cloudserver-replicator',
            isBuiltin: true,
            locationName: 'us-east-1',
          },
          { hostname: 's3.zenko.local', locationName: 'us-east-1' },
          { hostname: 'test.local', locationName: 'us-east-1' },
        ],
        instanceId,
        locations: {
          'europe25-myroom-cold': {
            locationType: 'location-dmf-v1',
            name: 'europe25-myroom-cold',
            isCold: true,
            details: {
              endpoint: 'ws://tape.myroom.europe25.cnes:8181',
              repoId: ['repoId'],
              nsId: 'nsId',
              username: 'username',
              password: 'password',
            },
          },
          'chapter-ux': {
            details: {
              accessKey: 'AMFFHQC1TTUIQ9K6B7LO',
              bootstrapList: [],
              bucketName: 'replication-for-chapter-ux',
              endpoint: 'http://s3.workloadplane.scality.local',
              region: 'us-east-1',
              secretKey: '*****',
            },
            locationType: 'location-scality-artesca-s3-v1',
            name: 'chapter-ux',
            objectId: '4ab68d3f-9eec-11ec-ae58-6e38b828d159',
          },
          'ring-nick': {
            details: {
              accessKey: 'CO558N0OWLDBUULGAAUU',
              bootstrapList: [],
              bucketMatch: true,
              bucketName: 'xdm-chapter-ux-test',
              endpoint: 'http://10.200.3.166',
              region: 'us-east-1',
              secretKey: '*****',
            },
            locationType: 'location-scality-ring-s3-v1',
            name: 'ring-nick',
            objectId: '99a06f79-c62c-11ec-b993-7e8a0ab79998',
          },
          'us-east-1': {
            isBuiltin: true,
            locationType: 'location-file-v1',
            name: 'us-east-1',
            objectId: '95dbedf5-9888-11ec-8565-1ac2af7d1e53',
          },
        },
        replicationStreams: [],
        updatedAt: '2022-04-27T13:18:58Z',
        users: [
          {
            arn: 'arn:aws:iam::000000000000:/scality-internal-services/',
            canonicalId:
              '04c6c688782f2b395faac05295cf05e41e05929b7992a20b5d680d36efea577c',
            createDate: '2022-02-28T11:21:07.000Z',
            email: 'scality@internal',
            id: '000000000000',
            userName: 'scality-internal-services',
          },
          {
            arn: 'arn:aws:iam::064609833007:/no-bucket/',
            canonicalId:
              '1e3492312ab47ab0785e3411824352a8fa8aab68cece94973af04167926b8f2c',
            createDate: '2022-03-18T12:51:44.000Z',
            email: 'no-bucket@test.com',
            id: '064609833007',
            userName: 'no-bucket',
          },
          {
            arn: 'arn:aws:iam::152883654752:/created-by-storage-account-owner/',
            canonicalId:
              'ec0d7198d88e327d3dea039682b619f13b84915e52f826b806b4ef9dab3d8c14',
            createDate: '2022-05-10T11:40:48.000Z',
            email: 'cheng@scality.com',
            id: '152883654752',
            userName: 'created-by-storage-account-owner',
          },
          {
            arn: 'arn:aws:iam::377232323695:/yanjin/',
            canonicalId:
              '8c3b89e95e9768755365a8c2d528e71bc7b1cab781ac118b0824cefe21abaf29',
            createDate: '2022-04-29T09:35:35.000Z',
            email: 'yanjin.cheng@scality.com',
            id: '377232323695',
            userName: 'yanjin',
          },
          {
            arn: 'arn:aws:iam::621762876784:/Asmaa/',
            canonicalId:
              '268ba54d07bb0c538dc76ddcac41164346b9e40726ac49642cb9ab54200639cd',
            createDate: '2022-03-02T09:08:41.000Z',
            email: 'asmaa.el.mokhtari@scality.com',
            id: '621762876784',
            userName: 'Asmaa',
          },
          {
            arn: 'arn:aws:iam::650126396693:/replication/',
            canonicalId:
              '3386f3d3b01cd125379943c25aea17149011b64479a5d01eb74dfcfe9129ee97',
            createDate: '2022-03-07T11:08:28.000Z',
            email: 'invalid@invalid',
            id: '650126396693',
            userName: 'replication',
          },
          {
            arn: 'arn:aws:iam::904321757948:/account-1/',
            canonicalId:
              'b9f93485ea8d62f2e6f780fa93c0da76849ee0c317c3fc892902b9179390efee',
            createDate: '2022-03-31T14:16:58.000Z',
            email: 'test@test.com',
            id: '904321757948',
            userName: 'account-1',
          },
          {
            arn: 'arn:aws:iam::970343539682:/test/',
            canonicalId:
              '47e1f39353f2c3b0579a544e12491057e1fec175895b75467463cffdd004897d',
            createDate: '2022-03-02T08:06:05.000Z',
            email: 'test@invalid',
            id: '970343539682',
            userName: 'test',
          },
          {
            arn: 'arn:aws:iam::998935415244:/pat/',
            canonicalId:
              'b41319703eadc6d8aecfd996eea678f10ab2f32c0d730403afdd5f8775c7a44e',
            createDate: '2022-03-07T16:29:54.000Z',
            email: 'invalid@pat.com',
            id: '998935415244',
            userName: 'pat',
          },
        ],
        version: 12,
      }),
    ),
  ),

  //Locations mocks below
  rest.post(
    `${baseUrl}/api/v1/instance/${instanceId}/locations`,
    (req, res, ctx) =>
      res(
        ctx.json({
          locationType: 'location-dmf-v1',
          name: 'europe25-myroom-cold',
          isCold: true,
          details: {
            endpoint: 'ws://tape.myroom.europe25.cnes:8181',
            repoId: ['repoId'],
            nsId: 'nsId',
            username: 'username',
            password: 'password',
          },
        }),
      ),
  ),

  rest.put(
    `${baseUrl}/api/v1/instance/${instanceId}/location/europe25-myroom-cold`,
    (req, res, ctx) =>
      res(
        ctx.json({
          locationType: 'location-dmf-v1',
          name: 'europe25-myroom-cold',
          isCold: true,
          details: {
            endpoint: 'ws://tape.myroom.europe25.cnes:8181',
            repoId: ['repoId'],
            nsId: 'nsId',
            username: 'username',
            password: 'password',
          },
        }),
      ),
  ),

  //Transitions mocks below
  rest.post(
    `${baseUrl}/api/v1/instance/${instanceId}/account/${ACCOUNT_NAME}/workflow/search`,
    (req, res, ctx) =>
      res(
        ctx.json([
          {
            replication: {
              destination: { locations: [{ name: 'location-aws-s3' }] },
              name: null,
              source: {
                bucketName: 'test-post-react-hook-form',
                prefix: 'tester',
              },
              streamId: '0d55a1d7-349c-4e79-932b-a502bcc45a8f',
              version: null,
            },
          },
          {
            transition: {
              bucketName: BUCKET_NAME,
              workflowId: '0d55a1d7-349c-4e79-932b-b502bcc45a8f',
              applyToVersions: 'current',
              type: 'bucket-workflow-transition-v2',
              triggerDelayDays: 15,
              locationName: 'dmf-location',
              enabled: true,
            },
          },
          {
            transition: {
              bucketName: BUCKET_NAME,
              workflowId: '1e55a1d7-349c-4e79-932b-b502bcc45a8f',
              applyToVersions: 'previous',
              type: 'bucket-workflow-transition-v2',
              triggerDelayDays: 15,
              locationName: 'dmf-location',
              enabled: true,
            },
          },
        ]),
      ),
  ),
  rest.post(
    `${baseUrl}/api/v1/config/instance/{instanceId}/bucket/{bucketName}/workflow/transition`,
    (req, res, ctx) =>
      res(
        ctx.json([
          {
            bucketName: BUCKET_NAME,
            workflowId: '1e55a1d7-349c-4e79-932b-b502bcc45a8f',
            applyToVersions: 'previous',
            type: 'bucket-workflow-transition-v2',
            triggerDelayDays: 15,
            locationName: 'dmf-location',
            enabled: true,
          },
        ]),
      ),
  ),
  rest.put(
    `${baseUrl}/api/v1/config/instance/${instanceId}/bucket/${BUCKET_NAME}/workflow/transition/1e55a1d7-349c-4e79-932b-b502bcc45a8f`,
    (req, res, ctx) =>
      res(
        ctx.json([
          {
            bucketName: BUCKET_NAME,
            workflowId: '1e55a1d7-349c-4e79-932b-b502bcc45a8f',
            applyToVersions: 'previous',
            type: 'bucket-workflow-transition-v2',
            triggerDelayDays: 15,
            locationName: 'dmf-location',
            enabled: true,
          },
        ]),
      ),
  ),
  rest.delete(
    `${baseUrl}/api/v1/config/instance/${instanceId}/bucket/${BUCKET_NAME}/workflow/transition/1e55a1d7-349c-4e79-932b-b502bcc45a8f`,
    (req, res, ctx) => res(ctx.status(200)),
  ),
];
