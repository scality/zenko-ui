import CreateWorkflow from '../CreateWorkflow';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import {
  queryByText,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { List } from 'immutable';
import userEvent from '@testing-library/user-event';
import { S3Bucket } from '../../../types/s3';
import * as hooks from '../../utils/hooks';
import { act } from 'react-dom/test-utils';
import { debug } from 'jest-preview';
import {
  mockBucketListing,
  mockBucketLocationConstraint,
  mockBucketVersionning,
} from '../../../js/mock/S3ClientMSWHandlers';
import { getConfigOverlay } from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';

const instanceId = INSTANCE_ID;
const accountName = 'pat';
const BUCKET_NAME = 'bucket';
const BUCKET_NAME_NON_VERSIONED = 'bucket-non-versioned';
const BUCKET_LOCATION = 'us-east-1';
const ACCOUNT_ID = '064609833007';
const buckets: S3Bucket[] = [
  {
    CreationDate: 'Wed Oct 07 2020 16:35:57',
    LocationConstraint: BUCKET_LOCATION,
    Name: BUCKET_NAME,
    VersionStatus: 'Enabled',
  },
  {
    CreationDate: 'Wed Oct 07 2020 16:35:57',
    LocationConstraint: BUCKET_LOCATION,
    Name: BUCKET_NAME_NON_VERSIONED,
    VersionStatus: 'Disabled',
  },
];
const locationAwsS3 = {
  details: {
    accessKey: 'accessKey1',
    bootstrapList: [],
    bucketMatch: true,
    bucketName: 'bucketName1',
    endpoint: 'http://aws.com',
    secretKey: 'secret',
  },
  locationType: 'location-aws-s3-v1',
  name: BUCKET_LOCATION,
  objectId: '1',
  sizeLimitGB: 123,
};

const server = setupServer(
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/account/${ACCOUNT_ID}/bucket/bucket/workflow/replication`,
    (req, res, ctx) => {
      return res(ctx.json([]));
    },
  ),
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/account/${ACCOUNT_ID}/workflow/search`,
    (req, res, ctx) => res(ctx.json([])),
  ),
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) =>
    res(
      ctx.json({
        IsTruncated: false,
        Accounts: [
          {
            Name: accountName,
            CreationDate: '2022-03-18T12:51:44Z',
            Roles: [
              {
                Name: 'another-role',
                Arn: `arn:aws:iam::${ACCOUNT_ID}:role/another-role`,
              },
            ],
          },
        ],
      }),
    ),
  ),
  mockBucketListing(),
  mockBucketLocationConstraint(),
  getConfigOverlay(zenkoUITestConfig.managementEndpoint, instanceId),
  mockBucketVersionning({ enabled: true }),
);

const selectors = {
  replicationOption: () =>
    screen.getByRole('option', {
      name: /Replication/i,
    }),
  expirationOption: () =>
    screen.getByRole('option', {
      name: /Expiration/i,
    }),
  transitionOption: () =>
    screen.getByRole('option', {
      name: /Transition/i,
    }),
  createButton: () => screen.getByRole('button', { name: /create/i }),
  cancelButton: () => screen.getByRole('button', { name: /cancel/i }),
  workflowTypeSelect: () => screen.getByLabelText(/rule type \*/i),
  locationSelect: () => screen.getByLabelText(/location name \*/i),
  bucketSelect: () => screen.getByLabelText(/bucket name \*/i),
  bucketVersionedOption: () =>
    screen.getByRole('option', {
      name: new RegExp(BUCKET_NAME),
    }),
  bucketNonVersionedOption: () =>
    screen.getByRole('option', { name: new RegExp(BUCKET_NAME_NON_VERSIONED) }),
  locationAWSS3: () =>
    screen.getByRole('option', { name: new RegExp(BUCKET_LOCATION) }),
};

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
  jest.setTimeout(10_000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CreateWorkflow', () => {
  it('should render the form to create a new replication', async () => {
    //S
    reduxRender(<CreateWorkflow />, {
      s3: {
        listBucketsResults: {
          list: List(buckets),
        },
      },
      configuration: {
        latest: {
          locations: {
            [BUCKET_LOCATION]: locationAwsS3,
          },
        },
      },
    });
    //E
    await waitFor(() => screen.getByText(/create new workflow/i));

    // Select Workflow Type
    userEvent.click(selectors.workflowTypeSelect());

    expect(selectors.replicationOption()).toBeInTheDocument();
    expect(selectors.expirationOption()).toBeInTheDocument();
    expect(selectors.transitionOption()).toBeInTheDocument();

    userEvent.click(selectors.replicationOption());

    // Select Bucket Name
    userEvent.click(selectors.bucketSelect());
    userEvent.click(selectors.bucketVersionedOption());

    // Select Destination
    userEvent.click(selectors.locationSelect());
    userEvent.click(selectors.locationAWSS3());

    //V
    await waitFor(() => {
      expect(selectors.createButton()).toBeEnabled();
    });
  });
  it.only('should display an error modal when workflow creation failed', async () => {
    //S
    server.use(
      rest.post(
        `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/account/${ACCOUNT_ID}/bucket/bucket/workflow/replication`,
        (req, res, ctx) => {
          return res(ctx.status(500));
        },
      ),
    );
    //E
    reduxRender(<CreateWorkflow />, {
      s3: {
        listBucketsResults: {
          list: List(buckets),
        },
      },
      instances: {
        selectedId: instanceId,
      },
      configuration: {
        latest: {
          locations: {
            [BUCKET_LOCATION]: locationAwsS3,
          },
        },
      },
      auth: {
        config: { iamEndpoint: TEST_API_BASE_URL },
        selectedAccount: { id: ACCOUNT_ID },
      },
    });

    await waitFor(() => screen.getByText(/create new workflow/i));

    // Select Workflow Type
    userEvent.click(selectors.workflowTypeSelect());

    expect(selectors.replicationOption()).toBeInTheDocument();
    expect(selectors.expirationOption()).toBeInTheDocument();
    expect(selectors.transitionOption()).toBeInTheDocument();

    userEvent.click(selectors.replicationOption());

    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading buckets...'),
    );

    // Select Bucket Name
    userEvent.click(selectors.bucketSelect());
    debug();
    userEvent.click(selectors.bucketVersionedOption());

    // Select Destination
    userEvent.click(selectors.locationSelect());
    userEvent.click(selectors.locationAWSS3());

    // Click on Create Button
    await waitFor(() => {
      expect(selectors.createButton()).toBeEnabled();
    });
    act(() => userEvent.click(selectors.createButton()));
    //V
    await waitFor(() => expect(screen.getByText('Error')));
  });
  it('should disable the replication option for the bucket which is not version enabled', () => {
    //S
    jest
      .spyOn(hooks, 'useQueryParams')
      .mockReturnValue(
        new URLSearchParams(`?bucket=${BUCKET_NAME_NON_VERSIONED}`),
      );
    //E
    reduxRender(<CreateWorkflow />, {
      s3: {
        listBucketsResults: {
          list: List(buckets),
        },
      },
    });
    // Select Workflow Type
    userEvent.click(selectors.workflowTypeSelect());
    //V
    expect(selectors.replicationOption()).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
