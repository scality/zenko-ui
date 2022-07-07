import { OBJECT_METADATA } from '../../../../actions/__tests__/utils/testUtil';
import { reduxMount } from '../../../../utils/test';
import * as T from '../../../../ui-elements/TableKeyValue2';
import MiddleEllipsis from '../../../../ui-elements/MiddleEllipsis';
import React from 'react';
import Properties from '../Properties';
import router from 'react-router';
describe('Properties', () => {
  beforeAll(() => {
    jest.spyOn(router, 'useLocation').mockReturnValue({
      pathname: `/buckets/test/objects?prefix=${OBJECT_METADATA.objectKey}`,
    });
  });
  it('Properties should render', () => {
    jest.spyOn(router, 'useParams').mockReturnValue({
      '0': undefined,
    });
    const { component } = reduxMount(
      <Properties objectMetadata={OBJECT_METADATA} />,
    );
    expect(component.find(Properties).isEmptyRender()).toBe(false);
  });
  it('Properties should render expected values', () => {
    const { component } = reduxMount(
      <Properties objectMetadata={OBJECT_METADATA} />,
    );
    const groupInfos = component.find(T.Group);
    expect(groupInfos).toHaveLength(2);
    // FIRST GROUP ITEMS TITLE
    const firstGroupInfos = groupInfos.first();
    expect(firstGroupInfos.find(T.GroupName).text()).toContain('Information');
    // FIRST GROUP ITEMS
    const firstGroupInfosContentItems = firstGroupInfos
      .find(T.GroupContent)
      .find(T.Row);
    const firstItemFirstGroup = firstGroupInfosContentItems.first();
    expect(firstItemFirstGroup.find(T.Key).text()).toContain('Name');
    expect(firstItemFirstGroup.find(T.Value).text()).toContain(
      OBJECT_METADATA.objectKey,
    );
    const secondItemFirstGroup = firstGroupInfosContentItems.at(1);
    expect(secondItemFirstGroup.find(T.Key).text()).toContain('Version ID');
    expect(secondItemFirstGroup.find(MiddleEllipsis).text()).toContain(
      OBJECT_METADATA.versionId,
    );
    const thirdItemFirstGroup = firstGroupInfosContentItems.at(2);
    expect(thirdItemFirstGroup.find(T.Key).text()).toContain('Size');
    expect(thirdItemFirstGroup.find(T.Value).text()).toContain('4 MiB');
    const fourthItemFirstGroup = firstGroupInfosContentItems.at(3);
    expect(fourthItemFirstGroup.find(T.Key).text()).toContain('Modified On');
    expect(fourthItemFirstGroup.find(T.Value).text()).toContain(
      '2020-10-16 10:06:54',
    );
    const fifthItemFirstGroup = firstGroupInfosContentItems.at(4);
    expect(fifthItemFirstGroup.find(T.Key).text()).toContain('Expires On');
    expect(fifthItemFirstGroup.find(T.Value).text()).toContain(
      '2022-07-13 07:58:11',
    );
    const sixthItemFirstGroup = firstGroupInfosContentItems.at(5);
    expect(sixthItemFirstGroup.find(T.Key).text()).toContain('ETag');
    expect(sixthItemFirstGroup.find(T.GroupValues).text()).toContain(
      OBJECT_METADATA.eTag,
    );
  });
  it('Properties should render expected values when object is locked', () => {
    const { component } = reduxMount(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: '2020-10-17 10:06:54',
          },
        }}
      />,
      {
        s3: {
          bucketInfo: {
            objectLockConfiguration: {
              ObjectLockEnabled: 'Enabled',
            },
          },
        },
      },
    );
    const tableItems = component.find(T.Row);
    const sixth = tableItems.at(6);
    expect(sixth.find(T.Key).text()).toContain('Lock');
    expect(sixth.find(T.GroupValues).text()).toContain('Locked (governance)');
    expect(sixth.find(T.GroupValues).text()).toContain(
      'until 2020-10-17 10:06:54',
    );
    expect(
      sixth.find('button#edit-object-retention-setting-btn').prop('label'),
    ).toBe('Edit');
  });
  it('Properties should render expected values when lock is released', () => {
    const { component } = reduxMount(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'RELEASED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: '2020-10-17 10:06:54',
          },
        }}
      />,
      {
        s3: {
          bucketInfo: {
            name: 'test-bucket',
            objectLockConfiguration: {
              ObjectLockEnabled: 'Enabled',
            },
          },
        },
      },
    );
    const tableItems = component.find(T.Row);
    const sixth = tableItems.at(6);
    expect(sixth.find(T.Key).text()).toContain('Lock');
    expect(sixth.find(T.GroupValues).text()).toContain(
      'Released since 2020-10-17 10:06:54',
    );
    expect(
      sixth.find('button#edit-object-retention-setting-btn').prop('label'),
    ).toBe('Edit');
  });
  it('Properties should render expected legal hold value when the object lock is set', () => {
    const { component } = reduxMount(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: '2020-10-17 10:06:54',
          },
          isLegalHoldEnabled: true,
        }}
      />,
      {
        s3: {
          bucketInfo: {
            name: 'test-bucket',
            objectLockConfiguration: {
              ObjectLockEnabled: 'Enabled',
            },
            versioning: 'Enabled',
          },
        },
      },
    );
    const tableItems = component.find(T.Row);
    const seventh = tableItems.at(7);
    expect(seventh.find(T.Key).text()).toContain('Legal Hold');
    expect(seventh.find(T.Value).text()).toContain('Active');
  });
});
