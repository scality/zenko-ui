import { OBJECT_METADATA } from '../../../../actions/__tests__/utils/testUtil';
import { reduxMount } from '../../../../utils/test';
import * as T from '../../../../ui-elements/TableKeyValue';
import MiddleEllipsis from '../../../../ui-elements/MiddleEllipsis';
import React from 'react';
import Properties from '../Properties';

describe('Properties', () => {
  it('Properties should render', () => {
    const { component } = reduxMount(
      <Properties objectMetadata={OBJECT_METADATA} />,
    );

    expect(component.find(Properties).isEmptyRender()).toBe(false);
  });

  it('Properties should render expected values', () => {
    const { component } = reduxMount(
      <Properties objectMetadata={OBJECT_METADATA} />,
    );

    const tableItems = component.find(T.Row);
    const firstItem = tableItems.first();
    expect(firstItem.find(T.Key).text()).toContain('Name');
    expect(firstItem.find(T.Value).text()).toContain(OBJECT_METADATA.objectKey);

    const secondItem = tableItems.at(1);
    expect(secondItem.find(T.Key).text()).toContain('Version ID');
    expect(secondItem.find(MiddleEllipsis).text()).toContain(
      OBJECT_METADATA.versionId,
    );

    const thirdItem = tableItems.at(2);
    expect(thirdItem.find(T.Key).text()).toContain('Size');
    expect(thirdItem.find(T.Value).text()).toContain('4 MiB');

    const fourthItem = tableItems.at(3);
    expect(fourthItem.find(T.Key).text()).toContain('Modified On');
    expect(fourthItem.find(T.Value).text()).toContain('2020-10-16 10:06:54');

    const fifthItem = tableItems.at(4);
    expect(fifthItem.find(T.Key).text()).toContain('ETag');
    expect(fifthItem.find(T.Value).text()).toContain(OBJECT_METADATA.eTag);

    const sixth = tableItems.at(5);
    expect(sixth.find(T.Key).text()).toContain('Lock');
    expect(sixth.find(T.Value).text()).toContain('No retention');
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
    );

    const tableItems = component.find(T.Row);

    const sixth = tableItems.at(5);
    expect(sixth.find(T.Key).text()).toContain('Lock');
    expect(sixth.find(T.Value).text()).toContain('Locked (governance)');
    expect(sixth.find(T.Value).text()).toContain('until 2020-10-17 10:06:54');
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
    );

    const tableItems = component.find(T.Row);

    const sixth = tableItems.at(5);
    expect(sixth.find(T.Key).text()).toContain('Lock');
    expect(sixth.find(T.Value).text()).toContain(
      'Released - since 2020-10-17 10:06:54',
    );
  });
});
