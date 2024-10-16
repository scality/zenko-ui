import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Immutable from 'immutable';
import {
  bucketInfoResponseNoVersioning,
  bucketInfoResponseObjectLockDefaultRetention,
  bucketInfoResponseObjectLockNoDefaultRetention,
  bucketInfoResponseVersioning,
  bucketInfoResponseVersioningDisabled,
  bucketName,
} from '../../../../../js/mock/S3Client';
import * as actions from '../../../../actions/s3bucket';
import {
  NewWrapper,
  renderWithRouterMatch,
  zenkoUITestConfig,
} from '../../../../utils/testUtil';
import Overview from '../Overview';

const BUCKET = {
  CreationDate: 'Tue Oct 12 2020 18:38:56',
  LocationConstraint: '',
  Name: bucketName,
};
const TEST_STATE = {
  uiBuckets: {
    showDelete: false,
  },
  workflow: {
    replications: [],
  },
  networkActivity: {
    counter: 0,
    messages: Immutable.List(),
  },
};
//TODO: Those tests are testing implementation details based on child component names. We should refactor them.
describe('Overview', () => {
  it('should render Overview component with given infos', () => {
    renderWithRouterMatch(
      <Overview
        //@ts-expect-error fix this when you are working on it
        bucket={BUCKET}
      />,
      undefined,
      {
        ...TEST_STATE,
        s3: {
          bucketInfo: bucketInfoResponseNoVersioning,
        },
      },
    );

    const labelAndValues = [
      { label: 'Name', value: bucketName },
      { label: 'Versioning', value: 'Suspended' },

      { label: 'Object-lock', value: 'Disabled' },
      { label: 'Location', value: /us-east-1/i },
      { label: 'Owner', value: 'bart' },
      { label: 'ACL', value: '0 Grantee' },
      { label: 'CORS', value: 'No' },
      { label: 'Public', value: 'No' },
    ];

    labelAndValues.forEach(({ label, value }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(label).parentElement).toHaveTextContent(value);
    });
  });
  it('should render toggle versioning in Enable mode', () => {
    renderWithRouterMatch(
      <Overview
        //@ts-expect-error fix this when you are working on it
        bucket={BUCKET}
      />,
      undefined,
      {
        ...TEST_STATE,
        s3: {
          bucketInfo: bucketInfoResponseVersioning,
        },
      },
    );

    expect(screen.getByText(/Versioning/i).parentElement).toHaveTextContent(
      'Active',
    );
  });
  it('should render object lock information in Enabled mode without default retention', () => {
    renderWithRouterMatch(
      <Overview
        //@ts-expect-error fix this when you are working on it
        bucket={BUCKET}
      />,
      undefined,
      {
        ...TEST_STATE,
        s3: {
          bucketInfo: bucketInfoResponseObjectLockNoDefaultRetention,
        },
      },
    );

    const labelAndValues = [
      { label: 'Name', value: bucketName },
      { label: 'Versioning', value: 'Enabled' },
      { label: 'Default Object-lock Retention', value: 'Inactive' },
    ];

    labelAndValues.forEach(({ label, value }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(label).parentElement).toHaveTextContent(value);
    });
  });
  it('should render object lock information in Enabled mode with default retention', () => {
    renderWithRouterMatch(
      <Overview
        //@ts-expect-error fix this when you are working on it
        bucket={BUCKET}
      />,
      undefined,
      {
        ...TEST_STATE,
        s3: {
          bucketInfo: bucketInfoResponseObjectLockDefaultRetention,
        },
      },
    );

    const labelAndValues = [
      { label: 'Name', value: bucketName },
      { label: 'Versioning', value: 'Enabled' },
      { label: 'Default Object-lock Retention', value: 'Governance - 5 days' },
    ];

    labelAndValues.forEach(({ label, value }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(label).parentElement).toHaveTextContent(value);
    });
  });
  it.skip('should trigger deleteBucket function when approving clicking on delete button when modal popup', async () => {
    //@ts-expect-error fix this when you are working on it
    const deleteBucketMock = jest.spyOn(actions, 'deleteBucket');
    renderWithRouterMatch(
      <Overview
        //@ts-expect-error fix this when you are working on it
        bucket={BUCKET}
      />,
      undefined,
      {
        ...TEST_STATE,
        ...{
          s3: {
            bucketInfo: bucketInfoResponseVersioning,
          },
        },
      },
    );
    const deleteButton = screen.getByRole('button', { name: /delete bucket/i });
    userEvent.click(deleteButton);
    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /confirmation/i }),
      ).toBeVisible();
    });
    const confirmationDialog = screen.getByRole('dialog', {
      name: /confirmation/i,
    });
    const confirmDeleteButton = within(confirmationDialog).getByRole('button', {
      name: /delete/i,
    });
    userEvent.click(confirmDeleteButton);
    expect(deleteBucketMock).toHaveBeenCalledWith(bucketName);
  });
  it('should disable the versioning toogle for Azure Blob Storage', async () => {
    //S
    renderWithRouterMatch(
      <Overview
        //@ts-expect-error fix this when you are working on it
        bucket={BUCKET}
      />,
      undefined,
      {
        ...TEST_STATE,
        ...{ s3: { bucketInfo: bucketInfoResponseVersioningDisabled } },
      },
    );
    await waitForElementToBeRemoved(() => screen.getByText(/loading/i));
    await waitFor(() => {
      expect(selectors.inActiveVersioningToggle()).toHaveAttribute('disabled');
    });
  });
});

//
//
//
//
//

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockBucketOperations,
  mockGetBucketTagging,
  mockGetBucketTaggingError,
  mockGetBucketTaggingNoSuchTagSet,
} from '../../../../../js/mock/S3ClientMSWHandlers';
import {
  ACCOUNT_ID,
  USERS,
  getConfigOverlay,
  getStorageConsumptionMetricsHandlers,
} from '../../../../../js/mock/managementClientMSWHandlers';
import {
  BUCKET_NAME,
  INSTANCE_ID,
} from '../../../../actions/__tests__/utils/testUtil';
import { VEEAM_BACKUP_REPLICATION } from '../../../../ui-elements/Veeam/VeeamConstants';
import { TEST_API_BASE_URL } from '../../../../utils/testUtil';

const mockResponse =
  '<VersioningConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Status>Enabled</Status></VersioningConfiguration>';
const TEST_ACCOUNT =
  USERS.find((user) => user.id === '064609833007')?.userName ?? '';
const TEST_ACCOUNT_CREATION_DATE =
  USERS.find((user) => user.id === '064609833007')?.createDate ?? '';
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
                Arn: 'arn:aws:iam::064609833007:role/scality-internal/storage-manager-role',
              },
            ],
          },
        ],
      }),
    );
  }),
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/instance/${INSTANCE_ID}/account/${ACCOUNT_ID}/bucket/bucket/workflow/replication`,
    (req, res, ctx) => {
      return res(ctx.json([]));
    },
  ),
  getConfigOverlay(zenkoUITestConfig.managementEndpoint, INSTANCE_ID),
  ...getStorageConsumptionMetricsHandlers(
    zenkoUITestConfig.managementEndpoint,
    INSTANCE_ID,
  ),
  mockBucketOperations(),
);
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

const selectors = {
  editDefaultRetentionButton: () =>
    screen.getByRole('button', {
      name: /edit default retention/i,
    }),
  bucketTaggingErrorToastCloseButton: () =>
    within(screen.getByRole('status')).getByRole('button', {
      name: /close/i,
    }),
  bucketTaggingErrorToast: () =>
    within(screen.getByRole('status')).getByText(
      /Encountered issues loading bucket tagging, causing uncertainty about the use-case. Please refresh the page./i,
    ),
  bucketTaggingErorToastQuery: () =>
    screen.queryByText(
      /Encountered issues loading bucket tagging, causing uncertainty about the use-case. Please refresh the page./i,
    ),
  isObjectLockEnabled: () =>
    screen.getByRole('generic', {
      name: /indicate if object lock is enabled/i,
    }),
  inActiveVersioningToggle: () =>
    screen.getByRole('checkbox', { name: /inactive/i }),
};

describe('Overview', () => {
  it('should call the updateBucketVersioning function when clicking on the toggle versioning button', async () => {
    const useUpdateBucketVersioningMock = jest.fn();
    server.use(
      rest.put(`${TEST_API_BASE_URL}/${BUCKET_NAME}`, (req, res, ctx) => {
        useUpdateBucketVersioningMock(req.body);
        return res(ctx.status(200));
      }),
      mockBucketOperations({
        isVersioningEnabled: false,
        isObjectLockEnabled: false,
      }),
    );

    render(
      <Overview
        //@ts-expect-error fix this when you are working on it
        bucket={{ name: bucketName }}
      />,
      { wrapper: NewWrapper() },
    );
    await waitFor(() => {
      expect(selectors.inActiveVersioningToggle()).toBeEnabled();
    });
    await userEvent.click(selectors.inActiveVersioningToggle());
    await waitFor(() => {
      expect(useUpdateBucketVersioningMock).toHaveBeenCalledWith(mockResponse);
    });
  });

  it('should display the Veeam use-case and disable the edition of default retention', async () => {
    //Setup
    server.use(mockGetBucketTagging(bucketName));
    //Exercise
    render(
      <Overview
        //@ts-expect-error fix this when you are working on it
        bucket={{ name: bucketName }}
      />,
      {
        wrapper: NewWrapper(),
      },
    );
    //Verify
    await waitFor(() => {
      expect(
        screen.getByText(
          new RegExp(`Backup - ${VEEAM_BACKUP_REPLICATION}`, 'i'),
        ),
      ).toBeInTheDocument();
    });
    expect(selectors.editDefaultRetentionButton()).toBeDisabled();
    expect(selectors.isObjectLockEnabled()).toHaveTextContent('Enabled');
  });

  it('should show error toast when loading bucket tagging failed', async () => {
    //Setup
    server.use(mockGetBucketTaggingError(bucketName));
    //Exercise
    render(
      <Overview
        //@ts-expect-error fix this when you are working on it
        bucket={{ name: bucketName }}
      />,
      {
        wrapper: NewWrapper(),
      },
    );
    //Verify
    await waitFor(() => {
      expect(selectors.bucketTaggingErrorToast()).toBeInTheDocument();
    });
    //Exercise
    await userEvent.click(selectors.bucketTaggingErrorToastCloseButton());
    //Verify
    await waitFor(() => {
      expect(selectors.bucketTaggingErorToastQuery()).toBe(null);
    });
  });

  it('should not show error toast if tags are not found', async () => {
    //Setup
    server.use(mockGetBucketTaggingNoSuchTagSet(bucketName));
    //Exercise
    render(
      <Overview
        //@ts-expect-error fix this when you are working on it
        bucket={{ name: bucketName }}
      />,
      {
        wrapper: NewWrapper(),
      },
    );
    //Verify
    await waitFor(() => {
      expect(selectors.bucketTaggingErorToastQuery()).toBe(null);
    });
  });

  it('should disable the versioning toggle for Veeam bucket', async () => {
    //S
    server.use(
      mockBucketOperations({
        isVersioningEnabled: false,
        isVeeamTagged: true,
        isObjectLockEnabled: false,
      }),
    );
    //E
    render(
      <Overview
        //@ts-expect-error fix this when you are working on it
        bucket={{ name: bucketName }}
      />,
      { wrapper: NewWrapper() },
    );
    //V
    await waitFor(() => {
      expect(selectors.inActiveVersioningToggle()).toBeInTheDocument();
    });

    // toBeDisabled() works only with the following element, but not with label.
    // https://html.spec.whatwg.org/multipage/semantics-other.html#disabled-elements
    // https://github.com/testing-library/jest-dom/blob/e8c8b13c6de2a0ccffaa6539809c8c11f141beca/src/to-be-disabled.js#L71
    await waitFor(() => {
      expect(selectors.inActiveVersioningToggle()).toHaveAttribute('disabled');
    });
  });
});
