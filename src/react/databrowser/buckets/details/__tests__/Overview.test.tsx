import * as T from '../../../../ui-elements/TableKeyValue2';
import * as actions from '../../../../actions/s3bucket';
import {
  bucketInfoResponseNoVersioning,
  bucketInfoResponseVersioning,
  bucketInfoResponseObjectLockNoDefaultRetention,
  bucketName,
  bucketInfoResponseObjectLockDefaultRetention,
} from '../../../../../js/mock/S3Client';
import Overview from '../Overview';
import { Toggle } from '@scality/core-ui';
import { reduxMount } from '../../../../utils/test';
const BUCKET = {
  CreationDate: 'Tue Oct 12 2020 18:38:56',
  LocationConstraint: '',
  Name: bucketName,
};
const TEST_STATE = {
  uiBuckets: {
    showDelete: '',
  },
  configuration: {
    latest: {
      locations: [
        {
          'us-east-1': {
            isBuiltin: true,
            locationType: 'location-file-v1',
            name: 'us-east-1',
            objectId: '1060b13c-d805-11ea-a59c-a0999b105a5f',
          },
        },
      ],
    },
  },
  workflow: {
    replications: [],
  },
  networkActivity: {
    counter: 0,
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
  it('should trigger deleteBucket function when approving clicking on delete button when modal popup', () => {
    const deleteBucketMock = jest.spyOn(actions, 'deleteBucket');
    const { component } = reduxMount(<Overview bucket={BUCKET} />, {
      ...TEST_STATE,
      ...{
        uiBuckets: {
          showDelete: bucketName,
        },
        s3: {
          bucketInfo: bucketInfoResponseVersioning,
        },
      },
    });
    const deleteButton = component.find(
      'button.delete-confirmation-delete-button',
    );
    deleteButton.simulate('click');
    expect(deleteBucketMock).toHaveBeenCalledTimes(1);
  });
});
