import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { DeleteWorkflowButton } from '../DeleteWorkflowButton';
import { Replication } from '../../../types/config';
import {
  NewWrapper,
  TEST_API_BASE_URL,
  queryClient,
} from '../../utils/testUtil';
import { debug } from 'jest-preview';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  ACCOUNT_ID,
  getColdStorageHandlers,
} from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import { BUCKET_NAME } from '../../../js/mock/managementClientMSWHandlers';

const WORFKLOW_ID = 'workflowId';

const mockWorkflow = {
  destination: {
    locations: [
      {
        name: 'eu-cloud-1',
      },
    ],
  },
  enabled: true,
  name: 'mock-workflow',
  source: {
    bucketName: BUCKET_NAME,
    prefix: 'text',
  },
  streamId: WORFKLOW_ID,
  version: 1,
} as Replication;

const TEST_ACCOUNT = 'test-account';
const TEST_ACCOUNT_CREATION_DATE = '2022-03-18T12:51:44Z';
const SUT = jest.fn();

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

describe('DeleteWorkflowButton', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });
  afterAll(() => server.close());

  const selectors = {
    deleteButton: () => screen.getByRole('button', { name: /Delete Workflow/ }),
    cancelButton: () => screen.getByRole('button', { name: /Cancel/ }),
    deleteConfirmationButton: () =>
      screen.getByRole('button', { name: /Delete/ }),
  };

  it('should render DeleteWorkflowButton component', () => {
    render(<DeleteWorkflowButton workflow={mockWorkflow} />, {
      wrapper: NewWrapper(),
    });

    expect(selectors.deleteButton()).toBeInTheDocument();
  });

  it('should open delete confirmation modal when delete button is clicked', () => {
    render(<DeleteWorkflowButton workflow={mockWorkflow} />, {
      wrapper: NewWrapper(),
    });

    fireEvent.click(selectors.deleteButton());
    const modalTitle = screen.getByText('Confirmation');
    expect(modalTitle).toBeInTheDocument();
  });

  it('should close delete confirmation modal when cancel button is clicked', () => {
    render(<DeleteWorkflowButton workflow={mockWorkflow} />, {
      wrapper: NewWrapper(),
    });

    fireEvent.click(selectors.deleteButton());
    fireEvent.click(selectors.cancelButton());
    const modalTitle = screen.queryByText('Confirmation');

    expect(modalTitle).not.toBeInTheDocument();
  });

  it('should delete workflow when delete button is clicked and checkbox is checked', async () => {
    server.use(
      rest.delete(
        `${TEST_API_BASE_URL}/api/v1/instance/${INSTANCE_ID}/account//bucket/${BUCKET_NAME}/workflow/replication/${WORFKLOW_ID}`,
        (req, res, ctx) => {
          SUT(req.body);
          return res(ctx.json([]));
        },
      ),
    );

    render(<DeleteWorkflowButton workflow={mockWorkflow} />, {
      wrapper: NewWrapper(),
    });

    fireEvent.click(selectors.deleteButton());
    expect(screen.queryByRole('checkbox')).not.toBeChecked();

    await act(async () => {
      userEvent.click(screen.getByRole('checkbox'));
    });

    expect(screen.getByRole('checkbox')).toBeChecked();

    const modalTitle = screen.queryByText('Confirmation');

    fireEvent.click(screen.getByLabelText('delete-confirmation-delete-button'));

    await waitFor(() => {
      expect(SUT).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(modalTitle).not.toBeInTheDocument();
    });
  });
});
