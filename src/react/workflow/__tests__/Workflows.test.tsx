import { screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  ACCOUNT_ID,
  BUCKET_NAME,
  getColdStorageHandlers,
  TRANSITION_WORKFLOW_CURRENT_ID,
  TRANSITION_WORKFLOW_PREVIOUS_ID,
} from '../../../js/mock/managementClientMSWHandlers';
import Router from 'react-router-dom';

import Workflows from '../Workflows';
import {
  mockOffsetSize,
  queryClient,
  reduxRender,
  TEST_API_BASE_URL,
} from '../../utils/testUtil';
import { List } from 'immutable';
import { mockBucketListing } from '../../../js/mock/S3ClientMSWHandlers';

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

jest.setTimeout(30000);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));
describe('Workflows', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
    mockOffsetSize(200, 800);
  });
  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });
  afterAll(() => server.close());

  const buckets = [
    {
      CreationDate: 'Wed Oct 07 2020 16:35:57',
      LocationConstraint: 'us-east-1',
      Name: BUCKET_NAME,
    },
  ];
  it('should display the generated name for transition applying to the current version', async () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      workflowId: `transition-${TRANSITION_WORKFLOW_CURRENT_ID}`,
    });
    reduxRender(<Workflows />, {
      auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
      s3: {
        listBucketsResults: {
          list: List(buckets),
        },
      },
      instances: {
        selectedId: INSTANCE_ID,
      },
    });
    await waitFor(() => screen.getByText(TEST_ACCOUNT));
    await waitFor(() => screen.getByText(/workflow description/i));

    //V
    expect(screen.getByText(TEST_ACCOUNT)).toBeInTheDocument();
    expect(
      screen.getByRole('row', {
        name: new RegExp(
          `${BUCKET_NAME} \\(current versions\\) ➜ europe25-myroom-cold - 15d transition active`,
          'i',
        ),
      }),
    ).toBeInTheDocument();
  });
  it('should display the generated name for transition applying to the noncurrent version', async () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      workflowId: `transition-${TRANSITION_WORKFLOW_PREVIOUS_ID}`,
    });

    reduxRender(<Workflows />, {
      auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
      s3: {
        listBucketsResults: {
          list: List(buckets),
        },
      },
      instances: {
        selectedId: INSTANCE_ID,
      },
    });
    await waitFor(() => screen.getByText(TEST_ACCOUNT));
    await waitFor(() => screen.getByText(/workflow description/i));

    //V
    expect(screen.getByText(TEST_ACCOUNT)).toBeInTheDocument();
    expect(
      screen.getByRole('row', {
        name: new RegExp(
          `${BUCKET_NAME} \\(previous versions\\) ➜ europe25-myroom-cold - 15d transition active`,
          'i',
        ),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', {
        name: /previous version/i,
      }),
    ).toBeChecked();
  });
  it('should display error if there is no buckets created', async () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      workflowId: `transition-${TRANSITION_WORKFLOW_CURRENT_ID}`,
    });
    server.use(mockBucketListing([]));

    reduxRender(<Workflows />, {
      auth: { config: { iamEndpoint: TEST_API_BASE_URL } },
      instances: {
        selectedId: INSTANCE_ID,
      },
    });
    await waitFor(() => screen.getByText(TEST_ACCOUNT));

    //V
    expect(
      screen.getByText(
        /Before browsing your workflows, create your first bucket./i,
      ),
    ).toBeInTheDocument();
  });
});
