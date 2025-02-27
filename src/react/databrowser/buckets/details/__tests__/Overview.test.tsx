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
  mockShellHooks,
  NewWrapper,
  renderWithRouterMatch,
  zenkoUITestConfig,
} from '../../../../utils/testUtil';
import Overview from '../Overview';
import * as bucketsMutation from '../../../../../react/next-architecture/domain/business/buckets';
import { VEEAM_VBO_APPLICATION } from '../../../../ISV/modules/veeam-vbo';
import { Bucket } from '../../../../next-architecture/domain/entities/bucket';

const bucketTest: Bucket = {
  name: bucketName,
  creationDate: new Date('2025-02-27T13:47:12.067Z'),
  locationConstraint: {
    status: 'success',
    value: 'us-east-1',
  },
  usedCapacity: {
    status: 'success',
    value: {
      type: 'noMetrics',
    },
  },
};

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
      <Overview bucket={bucketTest} ingestionStates={null} />,
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

    labelAndValues.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Async Metadata Updates/i)).toBeInTheDocument();
  });
  it('should render toggle versioning if Object-lock is disabled', async () => {
    renderWithRouterMatch(
      <Overview bucket={bucketTest} ingestionStates={null} />,
      undefined,
      {
        ...TEST_STATE,
        s3: {
          bucketInfo: bucketInfoResponseVersioning,
        },
      },
    );

    await waitFor(() => {
      expect(selectors.versioningToggle()).toBeInTheDocument();
    });
    //V
    expect(selectors.versioningToggle()).toBeEnabled();
  });
  it('should not render toggle versioning if Object-lock is enabled but display Enabled and help text', async () => {
    renderWithRouterMatch(
      <Overview bucket={bucketTest} ingestionStates={null} />,
      undefined,
      {
        ...TEST_STATE,
        s3: {
          bucketInfo: bucketInfoResponseObjectLockNoDefaultRetention,
        },
      },
    );

    await waitFor(() => {
      expect(selectors.versioningToggle()).not.toBeInTheDocument();
    });
    //V
    expect(
      screen.getByText(
        /Versioning cannot be suspended because Object-lock is enabled for this bucket./,
      ),
    ).toBeInTheDocument();
  });
  it('should render object lock information in Enabled mode without default retention', () => {
    renderWithRouterMatch(
      <Overview bucket={bucketTest} ingestionStates={null} />,
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
      <Overview bucket={bucketTest} ingestionStates={null} />,
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
  it('should not display Async Metadata update if XDM feature is not enabled', async () => {
    const useConfigMock = mockShellHooks.useConfig;
    useConfigMock.mockReturnValue({
      features: [],
    });
    //E
    render(<Overview bucket={bucketTest} ingestionStates={undefined} />, {
      wrapper: NewWrapper(),
    });
    //V
    await waitFor(() => {
      expect(
        screen.queryByText(/Async Metadata Updates/i),
      ).not.toBeInTheDocument();
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
  describe('Versioning toggle', () => {
    it('should disable the versioning toggle for Azure Blob Storage', async () => {
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

      await waitFor(() => {
        expect(selectors.versioningToggle()).toHaveAttribute('disabled');
      });
      await userEvent.hover(selectors.versioningToggle());
      expect(
        screen.getByText(
          /Enabling versioning is not possible due to the bucket being hosted on Microsoft Azure/i,
        ),
      ).toBeInTheDocument();
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
      render(<Overview bucket={bucketTest} ingestionStates={null} />, {
        wrapper: NewWrapper(),
      });
      //V
      await waitFor(() => {
        expect(selectors.versioningToggle()).toBeInTheDocument();
      });

      // toBeDisabled() works only with the following element, but not with label.
      // https://html.spec.whatwg.org/multipage/semantics-other.html#disabled-elements
      // https://github.com/testing-library/jest-dom/blob/e8c8b13c6de2a0ccffaa6539809c8c11f141beca/src/to-be-disabled.js#L71
      await waitFor(() => {
        expect(selectors.versioningToggle()).toHaveAttribute('disabled');
      });
      await userEvent.hover(selectors.versioningToggle());
      expect(
        screen.getByText(
          /Enabling versioning is not possible due to the bucket being managed by Veeam./i,
        ),
      ).toBeInTheDocument();
    });
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

      render(<Overview bucket={bucketTest} ingestionStates={null} />, {
        wrapper: NewWrapper(),
      });
      await waitFor(() => {
        expect(selectors.versioningToggle()).toBeEnabled();
      });
      await userEvent.click(selectors.versioningToggle());
      await waitFor(() => {
        expect(useUpdateBucketVersioningMock).toHaveBeenCalledWith(
          mockResponse,
        );
      });
    });
  });
  describe('Application', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('should render the application name and the use-case for previous Veeam Tag', async () => {
      //S
      server.use(mockGetBucketTagging(bucketName));

      //E
      render(<Overview bucket={bucketTest} ingestionStates={null} />, {
        wrapper: NewWrapper(),
      });
      //V
      await waitFor(() => {
        expect(
          screen.getByText(
            new RegExp(`Backup - ${VEEAM_BACKUP_REPLICATION}`, 'i'),
          ),
        ).toBeInTheDocument();
      });
    });
    it('should render application name and use-case for Bucket tagged as Veeam', async () => {
      //S
      jest.spyOn(bucketsMutation, 'useBucketTagging').mockImplementation(() => {
        return {
          tags: {
            status: 'success',
            value: {
              [`${BUCKET_TAG_APPLICATION}`]: VEEAM_VBO_APPLICATION,
            },
          },
        };
      });
      //E
      render(<Overview bucket={bucketTest} ingestionStates={null} />, {
        wrapper: NewWrapper(),
      });
      //V
      await waitFor(() => {
        expect(
          screen.getByText(
            new RegExp(`Backup - ${VEEAM_VBO_APPLICATION}`, 'i'),
          ),
        ).toBeInTheDocument();
      });
    });
    it('should render the application name if Bucket is tagged', async () => {
      //S
      jest.spyOn(bucketsMutation, 'useBucketTagging').mockImplementation(() => {
        return {
          tags: {
            status: 'success',
            value: {
              [`${BUCKET_TAG_APPLICATION}`]: 'Commvault',
            },
          },
        };
      });
      //E
      render(<Overview bucket={bucketTest} ingestionStates={null} />, {
        wrapper: NewWrapper(),
      });
      //V
      await waitFor(() => {
        expect(screen.getByText(/Commvault/i)).toBeInTheDocument();
      });
    });
    it('should render S3 Generic use-case if no tag is found', async () => {
      //S
      jest.spyOn(bucketsMutation, 'useBucketTagging').mockImplementation(() => {
        return {
          tags: {
            status: 'success',
            value: {},
          },
        };
      });
      //E
      render(<Overview bucket={bucketTest} ingestionStates={null} />, {
        wrapper: NewWrapper(),
      });
      //V
      await waitFor(() => {
        expect(screen.getByText(/S3 Generic/i)).toBeInTheDocument();
      });
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
  azureblobstorage,
  getConfigOverlay,
  getStorageConsumptionMetricsHandlers,
} from '../../../../../js/mock/managementClientMSWHandlers';
import {
  BUCKET_NAME,
  INSTANCE_ID,
} from '../../../../actions/__tests__/utils/testUtil';
import {
  BUCKET_TAG_APPLICATION,
  VEEAM_BACKUP_REPLICATION,
} from '../../../../ISV/constants';
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
  versioningToggle: () => screen.queryByRole('checkbox'),
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

    render(<Overview bucket={bucketTest} ingestionStates={null} />, {
      wrapper: NewWrapper(),
    });
    await waitFor(() => {
      expect(selectors.versioningToggle()).toBeEnabled();
    });
    await userEvent.click(selectors.versioningToggle());
    await waitFor(() => {
      expect(useUpdateBucketVersioningMock).toHaveBeenCalledWith(mockResponse);
    });
  });

  it('should show error toast when loading bucket tagging failed', async () => {
    //Setup
    server.use(mockGetBucketTaggingError(bucketName));
    //Exercise
    render(<Overview bucket={bucketTest} ingestionStates={null} />, {
      wrapper: NewWrapper(),
    });
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
    render(<Overview bucket={bucketTest} ingestionStates={null} />, {
      wrapper: NewWrapper(),
    });
    //Verify
    await waitFor(() => {
      expect(selectors.bucketTaggingErorToastQuery()).toBe(null);
    });
  });
  it('should disable the edition of default retention for Veeam Bucket', async () => {
    //Setup
    server.use(mockGetBucketTagging(bucketName));
    //Exercise
    render(<Overview bucket={bucketTest} ingestionStates={null} />, {
      wrapper: NewWrapper(),
    });
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
  it('should disable the edition of default retention for Bucket tagges as Veeam', async () => {
    //Setup
    jest.spyOn(bucketsMutation, 'useBucketTagging').mockImplementation(() => {
      return {
        tags: {
          status: 'success',
          value: {
            [`${BUCKET_TAG_APPLICATION}`]: VEEAM_VBO_APPLICATION,
          },
        },
      };
    });
    //Exercise
    render(<Overview bucket={bucketTest} ingestionStates={null} />, {
      wrapper: NewWrapper(),
    });
    //Verify
    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`Backup - ${VEEAM_VBO_APPLICATION}`, 'i')),
      ).toBeInTheDocument();
    });
    expect(selectors.editDefaultRetentionButton()).toBeDisabled();
    expect(selectors.isObjectLockEnabled()).toHaveTextContent('Enabled');
  });
});
