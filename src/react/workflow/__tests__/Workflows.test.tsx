import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import router from 'react-router';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  ACCOUNT_ID,
  BUCKET_NAME,
  getColdStorageHandlers,
  TRANSITION_WORKFLOW_CURRENT_ID,
} from '../../../js/mock/managementClientColdStorageMSWHandlers';
import Workflows from '../Workflows';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
} from '../../utils/test';
import { List } from 'immutable';

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

describe('Workflows', () => {
  const buckets = [
    {
      CreationDate: 'Wed Oct 07 2020 16:35:57',
      LocationConstraint: 'us-east-1',
      Name: BUCKET_NAME,
    },
  ];
  it('should display the generated name for transition apply to the current version', async () => {
    try {
      jest.spyOn(router, 'useParams').mockReturnValue({
        workflowId: TRANSITION_WORKFLOW_CURRENT_ID,
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
      await waitForElementToBeRemoved(
        () => [...screen.queryAllByText(/loading workflows/i)],
        { timeout: 8000 },
      );
      await waitFor(() => screen.getByText(/workflow description/i));

      //V
      expect(screen.getByText(TEST_ACCOUNT)).toBeInTheDocument();
      expect(
        screen.getByRole('row', {
          name: /new \(current versions\) ➜ europe25-myroom-cold - 15 days transition active/i,
        }),
      ).toBeInTheDocument();
    } catch (e) {
      console.log('should display the generated name for transition', e);
      throw e;
    }
  });
  it('should display error if there is no buckets created', async () => {
    try {
      jest.spyOn(router, 'useParams').mockReturnValue({
        workflowId: TRANSITION_WORKFLOW_CURRENT_ID,
      });
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
    } catch (e) {
      console.log('should display error if there is no buckets created');
      throw e;
    }
  });
});
