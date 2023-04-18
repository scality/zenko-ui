import { rest } from 'msw';
import { AccountInfo } from '../../react/next-architecture/domain/entities/account';
import { LatestUsedCapacity } from '../../react/next-architecture/domain/entities/metrics';

const ACCOUNT_ID = '789108670044';
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
export const BUCKET_NAME = 'test-bucket';
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

export const getStorageConsumptionMetricsHandlers = (
  baseUrl: string,
  instanceId: string,
) => [
  //GET storage consumption metrics for specified accounts
  rest.post(
    `${baseUrl}/api/v1/instance/${instanceId}/account/metrics`,
    (req, res, ctx) => {
      const { accounts } = req.body as { accounts: string[] };
      if (
        accounts.includes(ACCOUNT_CANONICAL_ID) &&
        accounts.includes(NEWLY_CREATED_ACCOUNT_CANONICAL_ID)
      )
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
      const { buckets } = req.body as { buckets: string[] };
      if (
        buckets.includes(BUCKET_ID) &&
        buckets.includes(NEWLY_CREATED_BUCKET_ID)
      )
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
    },
  ),

  //GET storage consumption metrics for locations
  rest.post(
    `${baseUrl}/api/v1/instance/${instanceId}/location/metrics`,
    (req, res, ctx) => {
      const { locations } = req.body as { locations: string[] };
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
