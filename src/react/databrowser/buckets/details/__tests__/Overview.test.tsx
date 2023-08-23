import { Toggle } from '@scality/core-ui';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
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
import * as T from '../../../../ui-elements/TableKeyValue2';
import {
  reduxMount,
  reduxRender,
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
  configuration: {
    latest: {
      locations: {
        'us-east-1': {
          isBuiltin: true,
          locationType: 'location-file-v1',
          name: 'us-east-1',
          objectId: '1060b13c-d805-11ea-a59c-a0999b105a5f',
        },

        'azure-blob': {
          locationType: 'location-azure-v1',
          name: 'azure-blob',
          objectId: '1060b13c-d806-11ea-a59c-a0999b105a5f',
        },
      },
    },
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
  it('should render Overview component', () => {
    const { component } = reduxMount(<Overview bucket={BUCKET} />, {
      ...TEST_STATE,
      s3: {
        bucketInfo: bucketInfoResponseNoVersioning,
      },
    });
    expect(component.find(Overview).isEmptyRender()).toBe(false);
  });
  it('should render Overview component with given infos', () => {
    const { component } = reduxMount(<Overview bucket={BUCKET} />, {
      ...TEST_STATE,
      s3: {
        bucketInfo: bucketInfoResponseNoVersioning,
      },
    });
    const groupInfos = component.find(T.Group);
    expect(groupInfos).toHaveLength(2);
    // FIRST GROUP ITEMS TITLE
    const firstGroupInfos = groupInfos.first();
    expect(firstGroupInfos.find(T.GroupName).text()).toContain('General');
    // FIRST GROUP ITEMS
    const firstGroupInfosContentItems = firstGroupInfos
      .find(T.GroupContent)
      .find(T.Row);
    const firstItemFirstGroup = firstGroupInfosContentItems.first();
    expect(firstItemFirstGroup.find(T.Key).text()).toContain('Name');
    expect(firstItemFirstGroup.find(T.Value).text()).toContain('bucket');
    const secondItemFirstGroup = firstGroupInfosContentItems.at(1);
    expect(secondItemFirstGroup.find(T.Key).text()).toContain('Versioning');
    expect(secondItemFirstGroup.find(Toggle).text()).toContain('Suspended');
    const thirdItemFirstGroup = firstGroupInfosContentItems.at(2);
    expect(thirdItemFirstGroup.find(T.Key).text()).toContain('Object-lock');
    expect(thirdItemFirstGroup.find(T.Value).text()).toContain('Disabled');
    const fourthItemFirstGroup = firstGroupInfosContentItems.at(3);
    expect(fourthItemFirstGroup.find(T.Key).text()).toContain('Location');
    expect(fourthItemFirstGroup.find(T.Value).text()).toContain('us-east-1');
    // SECOND GROUP ITEMS TITLE
    const secondGroupInfos = groupInfos.at(1);
    expect(secondGroupInfos.find(T.GroupName).text()).toContain('Permissions');
    // SECOND GROUP ITEMS
    const secondGroupInfosContentItems = secondGroupInfos
      .find(T.GroupContent)
      .find(T.Row);
    const firstItemSecondGroup = secondGroupInfosContentItems.first();
    expect(firstItemSecondGroup.find(T.Key).text()).toContain('Owner');
    expect(firstItemSecondGroup.find(T.Value).text()).toContain('bart');
    const secondItemSecondGroup = secondGroupInfosContentItems.at(1);
    expect(secondItemSecondGroup.find(T.Key).text()).toContain('ACL');
    expect(secondItemSecondGroup.find(T.Value).text()).toContain('0 Grantee');
    const thirdItemSecondGroup = secondGroupInfosContentItems.at(2);
    expect(thirdItemSecondGroup.find(T.Key).text()).toContain('CORS');
    expect(thirdItemSecondGroup.find(T.Value).text()).toContain('No');
    const fourthItemSecondGroup = secondGroupInfosContentItems.at(3);
    expect(fourthItemSecondGroup.find(T.Key).text()).toContain('Public');
    expect(fourthItemSecondGroup.find(T.Value).text()).toContain('No');
  });
  it('should render toggle versioning in Enable mode', () => {
    const { component } = reduxMount(<Overview bucket={BUCKET} />, {
      ...TEST_STATE,
      s3: {
        bucketInfo: bucketInfoResponseVersioning,
      },
    });
    const groupInfos = component.find(T.Group);
    const firstGroupInfos = groupInfos.first();
    const versioningToggleItem = firstGroupInfos.find(Toggle);
    expect(versioningToggleItem.text()).toContain('Active');
  });
  it('should render object lock information in Enabled mode without default retention', () => {
    const { component } = reduxMount(<Overview bucket={BUCKET} />, {
      ...TEST_STATE,
      s3: {
        bucketInfo: bucketInfoResponseObjectLockNoDefaultRetention,
      },
    });
    const groupInfos = component.find(T.Group);
    const firstGroupInfos = groupInfos.first();
    const firstGroupInfosContentItems = firstGroupInfos
      .find(T.GroupContent)
      .find(T.Row);
    const secondItemFirstGroup = firstGroupInfosContentItems.at(1);
    expect(secondItemFirstGroup.find(T.Key).text()).toContain('Versioning');
    expect(secondItemFirstGroup.find(T.Value).text()).toContain('Enabled');
    const thirdItemFirstGroup = firstGroupInfosContentItems.at(2);
    expect(thirdItemFirstGroup.find(T.Key).text()).toContain(
      'Default Object-lock Retention',
    );
    expect(thirdItemFirstGroup.find(T.GroupValues).text()).toContain(
      'Inactive',
    );
  });
  it('should render object lock information in Enabled mode with default retention', () => {
    const { component } = reduxMount(<Overview bucket={BUCKET} />, {
      ...TEST_STATE,
      s3: {
        bucketInfo: bucketInfoResponseObjectLockDefaultRetention,
      },
    });
    const groupInfos = component.find(T.Group);
    const firstGroupInfos = groupInfos.first();
    const firstGroupInfosContentItems = firstGroupInfos
      .find(T.GroupContent)
      .find(T.Row);
    const secondItemFirstGroup = firstGroupInfosContentItems.at(1);
    expect(secondItemFirstGroup.find(T.Key).text()).toContain('Versioning');
    expect(secondItemFirstGroup.find(T.Value).text()).toContain('Enabled');
    const thirdItemFirstGroup = firstGroupInfosContentItems.at(2);
    expect(thirdItemFirstGroup.find(T.Key).text()).toContain(
      'Default Object-lock Retention',
    );
    expect(thirdItemFirstGroup.find(T.GroupValues).text()).toContain(
      'Governance - 5 days',
    );
  });
  it.skip('should trigger deleteBucket function when approving clicking on delete button when modal popup', async () => {
    const deleteBucketMock = jest.spyOn(actions, 'deleteBucket');
    reduxRender(<Overview bucket={BUCKET} />, {
      ...TEST_STATE,
      ...{
        s3: {
          bucketInfo: bucketInfoResponseVersioning,
        },
      },
    });
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
    reduxRender(<Overview bucket={BUCKET} />, {
      ...TEST_STATE,
      ...{ s3: { bucketInfo: bucketInfoResponseVersioningDisabled } },
    });
    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', {
          name: /inactive/i,
        }),
      ).toBeInTheDocument();
    });
    const versioningToggleItem = screen.getByRole('checkbox', {
      name: /inactive/i,
    });
    //V
    expect(versioningToggleItem).toHaveAttribute('disabled');
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
  BUCKET_NAME,
  INSTANCE_ID,
} from '../../../../actions/__tests__/utils/testUtil';
import { TEST_API_BASE_URL } from '../../../../utils/testUtil';
import {
  ACCOUNT_ID,
  USERS,
  getConfigOverlay,
  getStorageConsumptionMetricsHandlers,
} from '../../../../../js/mock/managementClientMSWHandlers';
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
);
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe('Overview', () => {
  it('should call the updateBucketVersioning function when clicking on the toggle versioning button', async () => {
    const useUpdateBucketVersioningMock = jest.fn();
    server.use(
      rest.put(`${TEST_API_BASE_URL}/${BUCKET_NAME}`, (req, res, ctx) => {
        useUpdateBucketVersioningMock(req.body);
        return res(ctx.status(200));
      }),
    );

    reduxRender(<Overview bucket={BUCKET} />, {
      ...TEST_STATE,
      ...{ s3: { bucketInfo: bucketInfoResponseVersioningDisabled } },
    });

    const versioningToggleItem = screen
      .getByRole('checkbox', {
        name: /inactive/i,
      })
      .querySelector('input');

    await waitFor(() => {
      expect(versioningToggleItem).toBeInTheDocument();
    });

    versioningToggleItem && fireEvent.click(versioningToggleItem);

    await waitFor(() => {
      expect(useUpdateBucketVersioningMock).toHaveBeenCalledWith(mockResponse);
    });
  });
});
