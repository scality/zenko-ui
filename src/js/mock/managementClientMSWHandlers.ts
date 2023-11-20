import { rest } from 'msw';
import { AccountInfo } from '../../react/next-architecture/domain/entities/account';
import { LatestUsedCapacity } from '../../react/next-architecture/domain/entities/metrics';

/**
 * /!\ Prerequisites: Can be changed below /!\
 *   - Account id "718643629313"
 *   - Bucket name "new"
 */

export const ACCOUNT_ID = '718643629313';
export const BUCKET_NAME = 'test-bucket';
const azureblobstorage = 'azureblobstorage';

export const TRANSITION_WORKFLOW_CURRENT_ID =
  '0d55a1d7-349c-4e79-932b-b502bcc45a8f';
export const TRANSITION_WORKFLOW_PREVIOUS_ID =
  '1e55a1d7-349c-4e79-932b-b502bcc45a8f';
export const EXPIRATION_WORKFLOW_ID = '330f2359-dc93-4abd-97c1-37c8483b1872';
export const TRIGGER_DELAY_DAYS = 15;
export const COLD_LOCATION_NAME = 'europe25-myroom-cold';

export const USERS = [
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
];
export const LOCATIONS = {
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
    objectId: '5bb68d3f-9eec-11ec-ae58-6e38b828d159',
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
  [azureblobstorage]: {
    locationType: 'location-azure-v1',
    name: azureblobstorage,
    details: {},
  },
};

export const getConfigOverlay = (baseUrl: string, instanceId: string) => {
  return rest.get(
    `${baseUrl}/api/v1/config/overlay/view/${instanceId}`,
    (req, res, ctx) =>
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
          locations: LOCATIONS,
          replicationStreams: [],
          updatedAt: '2022-04-27T13:18:58Z',
          users: USERS,
          version: 12,
        }),
      ),
  );
};

export const getColdStorageHandlers = (baseUrl: string, instanceId: string) => [
  //Config overlay mock below
  getConfigOverlay(baseUrl, instanceId),
  //Locations mocks below
  rest.post(
    `${baseUrl}/api/v1/config/${instanceId}/location`,
    (req, res, ctx) =>
      res(
        ctx.json({
          locationType: 'location-dmf-v1',
          objectId: '5bb68d3f-9eec-11ec-ae58-6e38b828d159',
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
    `${baseUrl}/api/v1/config/${instanceId}/location/europe25-myroom-cold`,
    (req, res, ctx) =>
      res(
        ctx.json({
          locationType: 'location-dmf-v1',
          name: 'europe25-myroom-cold',
          objectId: '5bb68d3f-9eec-11ec-ae58-6e38b828d159',
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

  rest.delete(
    `${baseUrl}/api/v1/config/${instanceId}/location/europe25-myroom-cold`,
    (req, res, ctx) => res(ctx.status(204)),
  ),

  //Transitions mocks below
  rest.post(
    `${baseUrl}/api/v1/instance/${instanceId}/account/${ACCOUNT_ID}/workflow/search`,
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
              workflowId: TRANSITION_WORKFLOW_CURRENT_ID,
              applyToVersion: 'current',
              type: 'bucket-workflow-transition-v2',
              triggerDelayDays: TRIGGER_DELAY_DAYS,
              locationName: COLD_LOCATION_NAME,
              enabled: true,
            },
          },
          {
            transition: {
              bucketName: BUCKET_NAME,
              workflowId: TRANSITION_WORKFLOW_PREVIOUS_ID,
              applyToVersion: 'noncurrent',
              type: 'bucket-workflow-transition-v2',
              triggerDelayDays: TRIGGER_DELAY_DAYS,
              locationName: COLD_LOCATION_NAME,
              enabled: true,
            },
          },
          {
            expiration: {
              bucketName: BUCKET_NAME,
              enabled: true,
              filter: {
                objectTags: null,
              },
              type: 'bucket-workflow-expiration-v1',
              workflowId: EXPIRATION_WORKFLOW_ID,
              previousVersionTriggerDelayDays: 7,
            },
          },
        ]),
      ),
  ),
  rest.post(
    `${baseUrl}/api/v1/instance/${instanceId}/account/${ACCOUNT_ID}/bucket/${BUCKET_NAME}/workflow/transition`,
    (req, res, ctx) =>
      res(
        ctx.json([
          {
            bucketName: BUCKET_NAME,
            workflowId: TRANSITION_WORKFLOW_PREVIOUS_ID,
            applyToVersion: 'noncurrent',
            type: 'bucket-workflow-transition-v2',
            triggerDelayDays: TRIGGER_DELAY_DAYS,
            locationName: COLD_LOCATION_NAME,
            enabled: true,
          },
        ]),
      ),
  ),
  rest.put(
    `${baseUrl}/api/v1/instance/${instanceId}/account/${ACCOUNT_ID}/bucket/${BUCKET_NAME}/workflow/transition/1e55a1d7-349c-4e79-932b-b502bcc45a8f`,
    (req, res, ctx) =>
      res(
        ctx.json([
          {
            bucketName: BUCKET_NAME,
            workflowId: TRANSITION_WORKFLOW_PREVIOUS_ID,
            applyToVersion: 'noncurrent',
            type: 'bucket-workflow-transition-v2',
            triggerDelayDays: TRIGGER_DELAY_DAYS,
            locationName: COLD_LOCATION_NAME,
            enabled: true,
          },
        ]),
      ),
  ),
  rest.delete(
    `${baseUrl}/api/v1/instance/${instanceId}/account/${ACCOUNT_ID}/bucket/${BUCKET_NAME}/workflow/transition/1e55a1d7-349c-4e79-932b-b502bcc45a8f`,
    (req, res, ctx) => res(ctx.status(200)),
  ),
];

const NEWLY_CREATED_ACCOUNT_ID = '133319972005';
export const ACCOUNT_CANONICAL_ID =
  'c599240e575baf1295f6a1b8bbca5a09571623c04796f13846bb65c553c74195';
export const NEWLY_CREATED_ACCOUNT_CANONICAL_ID =
  'cc3a96b67df68e091921fb2fa0e9205a53f456948e7363367a7ce83fe6c5c5f0';
export const ACCOUNT_CREATION_DATE = '2023-03-27T12:58:13.000Z';
export const NEWLY_CREATED_ACCOUNT_CREATION_DATE = '2023-03-30T12:58:34.000Z';
export const ACCOUNT_NAME = 'yanjin';
export const NEWLY_CREATED_ACCOUNT_NAME = 'test';
export const ACCOUNT: AccountInfo = {
  id: ACCOUNT_ID,
  canonicalId: ACCOUNT_CANONICAL_ID,
  name: ACCOUNT_NAME,
  creationDate: new Date(ACCOUNT_CREATION_DATE),
};
export const NEWLY_CREATED_ACCOUNT: AccountInfo = {
  id: NEWLY_CREATED_ACCOUNT_ID,
  name: NEWLY_CREATED_ACCOUNT_NAME,
  canonicalId: NEWLY_CREATED_ACCOUNT_CANONICAL_ID,
  creationDate: new Date(NEWLY_CREATED_ACCOUNT_CREATION_DATE),
};
export const LOCATION_ID = 'de19517e-c99e-11ed-b9b0-f203387f3181';
export const NEWLY_CREATED_LOCATION_ID = '536a589c-cefa-11ed-8e79-8ed67c003e17';
export const TYPE_HAS_METRICS = 'hasMetrics';
export const TYPE_NO_METRICS = 'noMetrics';
export const BUCKET_CREATION_DATE = '2023-03-27T12:58:32.184Z';
export const BUCKET_ID = `${BUCKET_NAME}_${new Date(
  BUCKET_CREATION_DATE,
).getTime()}`;
export const NEWLY_CREATED_BUCKET_NAME = 'new-bucket';
export const NEWLY_CREATED_BUCKET_CREATION_DATE = '2023-04-12T13:43:58.799Z';
export const NEWLY_CREATED_BUCKET_ID = `${NEWLY_CREATED_BUCKET_NAME}_${new Date(
  NEWLY_CREATED_BUCKET_CREATION_DATE,
).getTime()}`;
export const MEASURED_ON = '2023-04-12T09:03:32Z';
export const USED_CAPACITY_CURRENT = 1024;
export const USED_CAPACITY_NON_CURRENT = 0;

export const ACCOUNT_METRICS: LatestUsedCapacity = {
  type: TYPE_HAS_METRICS,
  usedCapacity: {
    current: USED_CAPACITY_CURRENT,
    nonCurrent: USED_CAPACITY_NON_CURRENT,
  },
  measuredOn: new Date(MEASURED_ON),
};

export const NEWLY_CREATED_ACCOUNT_METRICS: LatestUsedCapacity = {
  type: TYPE_NO_METRICS,
};

export const LOCATIONS_METRICS_RESPONSE = {
  [LOCATION_ID]: {
    type: TYPE_HAS_METRICS,
    usedCapacity: {
      current: USED_CAPACITY_CURRENT,
      nonCurrent: USED_CAPACITY_NON_CURRENT,
    },
    measuredOn: new Date(MEASURED_ON),
  },
  [NEWLY_CREATED_LOCATION_ID]: { type: TYPE_NO_METRICS },
};

export const BUCKET_METRICS_RESPONSE = {
  [BUCKET_NAME]: {
    type: TYPE_HAS_METRICS,
    usedCapacity: {
      current: USED_CAPACITY_CURRENT,
      nonCurrent: USED_CAPACITY_NON_CURRENT,
    },
    measuredOn: new Date(MEASURED_ON),
  },
  [NEWLY_CREATED_BUCKET_NAME]: { type: TYPE_NO_METRICS },
};

export const getStorageConsumptionMetricsHandlers = (
  baseUrl: string,
  instanceId: string,
) => [
  //GET storage consumption metrics for specified accounts
  rest.post(
    `${baseUrl}/api/v1/instance/${instanceId}/account/metrics`,
    (req, res, ctx) => {
      const accounts = req.body as string[];

      if (
        accounts.includes(ACCOUNT_CANONICAL_ID) &&
        accounts.includes(NEWLY_CREATED_ACCOUNT_CANONICAL_ID)
      ) {
        return res(
          ctx.json({
            [ACCOUNT_CANONICAL_ID]: {
              type: TYPE_HAS_METRICS,
              usedCapacity: {
                current: USED_CAPACITY_CURRENT,
                nonCurrent: USED_CAPACITY_NON_CURRENT,
              },
              measuredOn: MEASURED_ON,
            },
            [NEWLY_CREATED_ACCOUNT_CANONICAL_ID]: { type: TYPE_NO_METRICS },
          }),
        );
      } else {
        const storageConsumptionMetrics = {};
        accounts.forEach((account) => {
          storageConsumptionMetrics[account] = {
            type: TYPE_HAS_METRICS,
            usedCapacity: {
              current: USED_CAPACITY_CURRENT,
              nonCurrent: USED_CAPACITY_NON_CURRENT,
            },
            measuredOn: MEASURED_ON,
          };
        });

        return res(ctx.json(storageConsumptionMetrics));
      }
    },
  ),

  //GET storage consumption metrics for a specific account
  rest.get(
    `${baseUrl}/api/v1/instance/${instanceId}/account/${ACCOUNT_CANONICAL_ID}/metrics`,
    (req, res, ctx) => {
      return res(
        ctx.json({
          usedCapacity: {
            current: USED_CAPACITY_CURRENT,
            nonCurrent: USED_CAPACITY_NON_CURRENT,
          },
          locations: {
            [LOCATION_ID]: {
              usedCapacity: {
                current: USED_CAPACITY_CURRENT,
                nonCurrent: USED_CAPACITY_NON_CURRENT,
              },
            },
          },
          measuredOn: MEASURED_ON,
        }),
      );
    },
  ),

  //GET storage consumption metrics for buckets
  rest.post(
    `${baseUrl}/api/v1/instance/${instanceId}/bucket/metrics`,
    (req, res, ctx) => {
      const buckets = req.body as string[];
      if (
        buckets.includes(BUCKET_ID) &&
        buckets.includes(NEWLY_CREATED_BUCKET_ID)
      ) {
        return res(
          ctx.json({
            [BUCKET_NAME]: {
              type: TYPE_HAS_METRICS,
              usedCapacity: {
                current: USED_CAPACITY_CURRENT,
                nonCurrent: USED_CAPACITY_NON_CURRENT,
              },
              measuredOn: MEASURED_ON,
            },
            [NEWLY_CREATED_BUCKET_NAME]: { type: TYPE_NO_METRICS },
          }),
        );
      } else {
        const bucketMetrics = {};
        buckets.forEach((b) => {
          bucketMetrics[b] = {
            type: TYPE_HAS_METRICS,
            usedCapacity: {
              current: USED_CAPACITY_CURRENT,
              nonCurrent: USED_CAPACITY_NON_CURRENT,
            },
            measuredOn: MEASURED_ON,
          };
        });
        return res(ctx.json(bucketMetrics));
      }
    },
  ),

  //GET storage consumption metrics for locations
  rest.post(
    `${baseUrl}/api/v1/instance/${instanceId}/location/metrics`,
    (req, res, ctx) => {
      const locations = req.body as string[];
      if (
        locations.includes(LOCATION_ID) &&
        locations.includes(NEWLY_CREATED_LOCATION_ID)
      )
        return res(
          ctx.json({
            [LOCATION_ID]: {
              type: TYPE_HAS_METRICS,
              usedCapacity: {
                current: USED_CAPACITY_CURRENT,
                nonCurrent: USED_CAPACITY_NON_CURRENT,
              },
              measuredOn: MEASURED_ON,
            },
            [NEWLY_CREATED_LOCATION_ID]: { type: TYPE_NO_METRICS },
          }),
        );
    },
  ),
];
