import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { List } from 'immutable';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { getConfigOverlay } from '../../../js/mock/managementClientMSWHandlers';
import {
  mockBucketListing,
  mockBucketOperations,
} from '../../../js/mock/S3ClientMSWHandlers';
import { S3Bucket } from '../../../types/s3';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import * as DSRProvider from '../../DataServiceRoleProvider';
import { DEFAULT_METRICS_MESURED_ON } from '../../next-architecture/adapters/metrics/MockedMetricsAdapter';
import * as hooks from '../../utils/hooks';
import {
  mockOffsetSize,
  reduxRender,
  renderWithRouterMatch,
  selectClick,
  TEST_API_BASE_URL,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import CreateWorkflow from '../CreateWorkflow';

const instanceId = INSTANCE_ID;
const accountName = 'pat';
const BUCKET_NAME = 'bucket1';
const BUCKET_NAME_NON_VERSIONED = 'bucket-non-versioned';
const BUCKET_LOCATION = 'chapter-ux';
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

const defaultCurrentAccount = {
  id: 'account-id-renard',
  Name: 'Renard',
  Roles: [],
  CreationDate: DEFAULT_METRICS_MESURED_ON,
};

const server = setupServer(
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/account/${defaultCurrentAccount.id}/bucket/bucket/workflow/replication`,
    (req, res, ctx) => {
      return res(ctx.json([]));
    },
  ),
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/account/${defaultCurrentAccount.id}/workflow/search`,
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
                Arn: `arn:aws:iam::${defaultCurrentAccount.id}:role/another-role`,
              },
            ],
          },
        ],
      }),
    ),
  ),
  mockBucketListing(),
  mockBucketOperations({ isVersioningEnabled: true }),
  getConfigOverlay(zenkoUITestConfig.managementEndpoint, instanceId),
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
  jest.spyOn(DSRProvider, 'useCurrentAccount').mockReturnValue({
    account: defaultCurrentAccount,
  });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

jest.setTimeout(50_000);
describe('CreateWorkflow', () => {
  it('should render the form to create a new replication', async () => {
    //S
    renderWithRouterMatch(<CreateWorkflow />, undefined, {
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
    await selectClick(selectors.workflowTypeSelect());

    expect(selectors.replicationOption()).toBeInTheDocument();
    expect(selectors.expirationOption()).toBeInTheDocument();
    expect(selectors.transitionOption()).toBeInTheDocument();

    await userEvent.click(selectors.replicationOption());

    if (screen.queryAllByText('Loading locations...').length > 0) {
      await waitForElementToBeRemoved(() =>
        screen.getByText('Loading locations...'),
      );
    }
    if (screen.queryAllByText('Loading buckets...').length > 0) {
      await waitForElementToBeRemoved(() =>
        screen.getByText('Loading buckets...'),
      );
    }

    // Select Bucket Name
    await selectClick(selectors.bucketSelect());
    await waitFor(() =>
      expect(selectors.bucketVersionedOption()).toBeEnabled(),
    );
    await userEvent.click(selectors.bucketVersionedOption());

    // Select Destination
    await selectClick(selectors.locationSelect());

    await userEvent.click(selectors.locationAWSS3());
    //V
    await waitFor(
      () => {
        expect(selectors.createButton()).toBeEnabled();
      },
      { timeout: 10_000 },
    );
  });

  // FIXME We should remove this test. Testing the modal is not necessary.
  it('should display an error modal when workflow creation failed', async () => {
    //S
    server.use(
      rest.post(
        `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/account/${defaultCurrentAccount.id}/bucket/bucket/workflow/replication`,
        (req, res, ctx) => {
          return res(ctx.status(500));
        },
      ),
    );
    //E

    renderWithRouterMatch(<CreateWorkflow />, undefined, {
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
    });

    await waitFor(() => screen.getByText(/create new workflow/i));

    // Select Workflow Type
    await selectClick(selectors.workflowTypeSelect());

    expect(selectors.replicationOption()).toBeInTheDocument();
    expect(selectors.expirationOption()).toBeInTheDocument();
    expect(selectors.transitionOption()).toBeInTheDocument();

    await userEvent.click(selectors.replicationOption());

    if (screen.queryAllByText('Loading locations...').length > 0) {
      await waitForElementToBeRemoved(() =>
        screen.getByText('Loading locations...'),
      );
    }
    if (screen.queryAllByText('Loading buckets...').length > 0) {
      await waitForElementToBeRemoved(() =>
        screen.getByText('Loading buckets...'),
      );
    }

    // Select Bucket Name
    await selectClick(selectors.bucketSelect());
    await waitFor(() =>
      expect(selectors.bucketVersionedOption()).toBeEnabled(),
    );
    await userEvent.click(selectors.bucketVersionedOption());

    // Select Destination
    await selectClick(selectors.locationSelect());
    await userEvent.click(selectors.locationAWSS3());

    // Click on Create Button
    await waitFor(
      () => {
        expect(selectors.createButton()).toBeEnabled();
      },
      { timeout: 10_000 },
    );
    await userEvent.click(selectors.createButton());
    //V
    await waitFor(() => expect(screen.getByText('Error')));
  });
  it('should disable the replication option for the bucket which is not version enabled', async () => {
    //S
    jest
      .spyOn(hooks, 'useQueryParams')
      .mockReturnValue(
        new URLSearchParams(`?bucket=${BUCKET_NAME_NON_VERSIONED}`),
      );
    server.use(mockBucketOperations({ isVersioningEnabled: false }));
    //E
    reduxRender(<CreateWorkflow />, {
      s3: {
        listBucketsResults: {
          list: List(buckets),
        },
      },
    });
    // Select Workflow Type
    await selectClick(selectors.workflowTypeSelect());
    //V
    await waitFor(() => {
      expect(selectors.replicationOption()).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });
});
