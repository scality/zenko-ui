import { screen, waitFor } from '@testing-library/react';
import { List } from 'immutable';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { BucketWorkflowTransitionV2 } from '../../../js/managementClient/api';
import {
  ACCOUNT_ID,
  BUCKET_NAME,
  COLD_LOCATION_NAME,
  getColdStorageHandlers,
  TRANSITION_WORKFLOW_CURRENT_ID,
  TRIGGER_DELAY_DAYS,
} from '../../../js/mock/managementClientColdStorageMSWHandlers';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
} from '../../utils/testUtil';
import TransitionTable from '../TransitionTable';

const INSTANCE_ID = '25050307-cd09-4feb-9c2e-c93e2e844fea';
const TEST_ACCOUNT = 'Test Account';
const TEST_ACCOUNT_CREATION_DATE = '2022-03-18T12:51:44Z';

const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
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
                Arn: `arn:aws:iam::${ACCOUNT_ID}:role/scality-internal/storage-manager-role`,
              },
            ],
          },
        ],
      }),
    );
  }),
  ...getColdStorageHandlers(TEST_API_BASE_URL, INSTANCE_ID),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
  jest.setTimeout(10_000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Transition Table', () => {
  const buckets = [
    {
      CreationDate: 'Wed Oct 07 2020 16:35:57',
      LocationConstraint: 'us-east-1',
      Name: BUCKET_NAME,
    },
  ];

  it('should render the existing transitions', async () => {
    reduxRender(
      <TransitionTable
        bucketName={BUCKET_NAME}
        applyToVersion={BucketWorkflowTransitionV2.ApplyToVersionEnum.Current}
        objectKeyPrefix={''}
        objectTags={[]}
      />,
      {
        auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
        s3: {
          listBucketsResults: {
            list: List(buckets),
          },
        },
        instances: {
          selectedId: INSTANCE_ID,
        },
      },
    );
    await waitFor(() =>
      expect(screen.getByText(/description/i)).toBeInTheDocument(),
    );
    //V
    expect(
      screen.getByRole('row', {
        name: /15 europe25-myroom-cold all current objects older than 15 days will transition to europe25-myroom-cold/i,
      }),
    ).toBeInTheDocument();
  });

  it('should display the transition which has the same prefix as the transition form', async () => {
    reduxRender(
      <TransitionTable
        bucketName={BUCKET_NAME}
        applyToVersion={BucketWorkflowTransitionV2.ApplyToVersionEnum.Current}
        objectKeyPrefix={'objectKeyPrefix'}
        objectTags={[]}
      />,
      {
        auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
        s3: {
          listBucketsResults: {
            list: List(buckets),
          },
        },
        instances: {
          selectedId: INSTANCE_ID,
        },
      },
    );

    server.use(
      rest.post(
        `${TEST_API_BASE_URL}/api/v1/instance/${INSTANCE_ID}/account/${ACCOUNT_ID}/workflow/search`,
        (req, res, ctx) =>
          res(
            ctx.json([
              {
                transition: {
                  bucketName: BUCKET_NAME,
                  workflowId: TRANSITION_WORKFLOW_CURRENT_ID,
                  applyToVersion:
                    BucketWorkflowTransitionV2.ApplyToVersionEnum.Current,
                  type: 'bucket-workflow-transition-v2',
                  triggerDelayDays: TRIGGER_DELAY_DAYS,
                  locationName: COLD_LOCATION_NAME,
                  enabled: true,
                  filter: {
                    objectKeyPrefix: 'objectKeyPrefix',
                  },
                },
              },
            ]),
          ),
      ),
    );

    await waitFor(() =>
      expect(screen.getByText(/description/i)).toBeInTheDocument(),
    );
    //V
    expect(
      screen.getByRole('row', {
        name: /15 europe25-myroom-cold all current objects older than 15 days will transition to europe25-myroom-cold/i,
      }),
    ).toBeInTheDocument();
  });

  it('should not display the transition table if there is no transition has the same prefiex in the filter', () => {
    reduxRender(
      <TransitionTable
        bucketName={BUCKET_NAME}
        applyToVersion={BucketWorkflowTransitionV2.ApplyToVersionEnum.Current}
        objectKeyPrefix={''}
        objectTags={[]}
      />,
      {
        auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
        s3: {
          listBucketsResults: {
            list: List(buckets),
          },
        },
        instances: {
          selectedId: INSTANCE_ID,
        },
      },
    );

    server.use(
      rest.post(
        `${TEST_API_BASE_URL}/api/v1/instance/${INSTANCE_ID}/account/${ACCOUNT_ID}/workflow/search`,
        (req, res, ctx) =>
          res(
            ctx.json([
              {
                transition: {
                  bucketName: BUCKET_NAME,
                  workflowId: TRANSITION_WORKFLOW_CURRENT_ID,
                  applyToVersion:
                    BucketWorkflowTransitionV2.ApplyToVersionEnum.Current,
                  type: 'bucket-workflow-transition-v2',
                  triggerDelayDays: TRIGGER_DELAY_DAYS,
                  locationName: COLD_LOCATION_NAME,
                  enabled: true,
                  filter: {
                    objectKeyPrefix: 'objectKeyPrefix',
                  },
                },
              },
            ]),
          ),
      ),
    );
    //V
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('should not display the transition there is no transition has the same tags in the filter', () => {
    reduxRender(
      <TransitionTable
        bucketName={BUCKET_NAME}
        applyToVersion={BucketWorkflowTransitionV2.ApplyToVersionEnum.Current}
        objectKeyPrefix={''}
        objectTags={[{ key: 'tagKey', value: 'tagValue' }]}
      />,
      {
        auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
        s3: {
          listBucketsResults: {
            list: List(buckets),
          },
        },
        instances: {
          selectedId: INSTANCE_ID,
        },
      },
    );

    server.use(
      rest.post(
        `${TEST_API_BASE_URL}/api/v1/instance/${INSTANCE_ID}/account/${ACCOUNT_ID}/workflow/search`,
        (req, res, ctx) =>
          res(
            ctx.json([
              {
                transition: {
                  bucketName: BUCKET_NAME,
                  workflowId: TRANSITION_WORKFLOW_CURRENT_ID,
                  applyToVersion:
                    BucketWorkflowTransitionV2.ApplyToVersionEnum.Current,
                  type: 'bucket-workflow-transition-v2',
                  triggerDelayDays: TRIGGER_DELAY_DAYS,
                  locationName: COLD_LOCATION_NAME,
                  enabled: true,
                },
              },
            ]),
          ),
      ),
    );
    //V
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('should display the transition which has the same tags as the transition form', async () => {
    reduxRender(
      <TransitionTable
        bucketName={BUCKET_NAME}
        applyToVersion={BucketWorkflowTransitionV2.ApplyToVersionEnum.Current}
        objectKeyPrefix={''}
        objectTags={[{ key: 'tagKey', value: 'tagValue' }]}
      />,
      {
        auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
        s3: {
          listBucketsResults: {
            list: List(buckets),
          },
        },
        instances: {
          selectedId: INSTANCE_ID,
        },
      },
    );

    server.use(
      rest.post(
        `${TEST_API_BASE_URL}/api/v1/instance/${INSTANCE_ID}/account/${ACCOUNT_ID}/workflow/search`,
        (req, res, ctx) =>
          res(
            ctx.json([
              {
                transition: {
                  bucketName: BUCKET_NAME,
                  workflowId: TRANSITION_WORKFLOW_CURRENT_ID,
                  applyToVersion:
                    BucketWorkflowTransitionV2.ApplyToVersionEnum.Current,
                  type: 'bucket-workflow-transition-v2',
                  triggerDelayDays: TRIGGER_DELAY_DAYS,
                  locationName: COLD_LOCATION_NAME,
                  enabled: true,
                  filter: {
                    objectTags: [{ key: 'tagKey', value: 'tagValue' }],
                  },
                },
              },
            ]),
          ),
      ),
    );
    await waitFor(() =>
      expect(screen.getByText(/description/i)).toBeInTheDocument(),
    );
    //V
    expect(
      screen.getByRole('row', {
        name: /15 europe25-myroom-cold all current objects older than 15 days will transition to europe25-myroom-cold/i,
      }),
    ).toBeInTheDocument();
  });
});
