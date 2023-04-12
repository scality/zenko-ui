import { rest } from 'msw';

const ACCOUNT_CANONICAL_ID = '789108670044';
const NEWLY_CREATED_ACCOUNT_CANONICAL_ID = '133319972005';
const LOCATION_ID = 'de19517e-c99e-11ed-b9b0-f203387f3181';
const NEWLY_CREATED_LOCATION_ID = '536a589c-cefa-11ed-8e79-8ed67c003e17';
const TYPE_HAS_METRICS = 'hasMetrics';
const TYPE_NO_METRICS = 'noMetrics';
const BUCKET_NAME = 'test-bucket';
const BUCKET_CREATION_DATE = '2023-03-27T12:58:32.184Z';
const BUCKET_ID = `${BUCKET_NAME}_${new Date(BUCKET_CREATION_DATE).getTime()}`;
const NEWLY_CREATED_BUCKET_NAME = 'new-bucket';
const NEWLY_CREATED_BUCKET_CREATION_DATE = '2023-04-12T13:43:58.799Z';
const NEWLY_CREATED_BUCKET_ID = `${NEWLY_CREATED_BUCKET_NAME}_${new Date(
  NEWLY_CREATED_BUCKET_CREATION_DATE,
).getTime()}`;
const MEASURED_ON = '2023-04-12T09:03:32Z';
const USED_CAPACITY_CURRENT = 1024;
const USED_CAPACITY_NON_CURRENT = 0;

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
