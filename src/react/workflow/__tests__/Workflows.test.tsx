import { screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  ACCOUNT_ID,
  BUCKET_NAME,
  EXPIRATION_WORKFLOW_ID,
  getColdStorageHandlers,
  TRANSITION_WORKFLOW_CURRENT_ID,
  TRANSITION_WORKFLOW_PREVIOUS_ID,
} from '../../../js/mock/managementClientMSWHandlers';
import Workflows from '../Workflows';
import {
  mockOffsetSize,
  queryClient,
  renderWithRouterMatch,
  TEST_API_BASE_URL,
} from '../../utils/testUtil';
import {
  mockBucketListing,
  mockBucketOperations,
} from '../../../js/mock/S3ClientMSWHandlers';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';

const TEST_ACCOUNT = 'test-account';
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

describe('Workflows', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
    mockOffsetSize(200, 1000);
  });
  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });
  afterAll(() => server.close());

  it('should display the generated name for transition applying to the current version', async () => {
    renderWithRouterMatch(
      <Workflows />,
      {
        path: '/accounts/:accountName/workflows/:workflowId?',
        route: `/accounts/${TEST_ACCOUNT}/workflows/transition-${TRANSITION_WORKFLOW_CURRENT_ID}`,
      },
      {
        instances: {
          selectedId: INSTANCE_ID,
        },
      },
    );
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
    // Verify the button of advanced metrics
    expect(
      screen.getByRole('button', { name: /Advanced metrics/i }),
    ).toBeInTheDocument();
  });
  it('should display the generated name for transition applying to the noncurrent version', async () => {
    renderWithRouterMatch(
      <Workflows />,
      {
        path: '/accounts/:accountName/workflows/:workflowId?',
        route: `/accounts/${TEST_ACCOUNT}/workflows/transition-${TRANSITION_WORKFLOW_PREVIOUS_ID}`,
      },
      {
        instances: {
          selectedId: INSTANCE_ID,
        },
      },
    );

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
    server.use(mockBucketListing([]));

    renderWithRouterMatch(<Workflows />, {
      path: '/accounts/:accountName/workflows',
      route: `/accounts/${TEST_ACCOUNT}/workflows`,
    });

    await waitFor(() => screen.getByText(TEST_ACCOUNT));

    //V
    expect(
      screen.getByText(
        /Before browsing your workflows, create your first bucket./i,
      ),
    ).toBeInTheDocument();
  });

  it('should display the correct expiration form', async () => {
    //S
    server.use(
      mockBucketListing([
        {
          Name: BUCKET_NAME,
          CreationDate: new Date('2021-03-18T12:51:44Z'),
        },
      ]),
      mockBucketOperations({
        isVersioningEnabled: (bucketName) => bucketName === BUCKET_NAME,
      }),
    );
    renderWithRouterMatch(
      <Workflows />,
      {
        path: '/accounts/:accountName/workflows/:workflowId?',
        route: `/accounts/${TEST_ACCOUNT}/workflows/expiration-${EXPIRATION_WORKFLOW_ID}`,
      },
      { instances: { selectedId: INSTANCE_ID } },
    );
    //E
    await waitFor(() => screen.getByText(TEST_ACCOUNT));
    await waitFor(() => screen.queryAllByText(/expiration/i));
    //V
    expect(
      screen.getByRole('checkbox', {
        name: /Expire Previous version of objects/i,
      }),
    ).toBeChecked();
  });
});
