import * as s3object from '../../../actions/s3object';
import {
  BUCKET_INFO,
  FIRST_FORMATTED_OBJECT,
  SECOND_FORMATTED_OBJECT,
} from './utils/testUtil';
import {
  LIST_OBJECTS_METADATA_TYPE,
  LIST_OBJECTS_S3_TYPE,
} from '../../../utils/s3';
import { checkBox, reduxMount } from '../../../utils/test';
import { BUCKET_NAME } from '../../../actions/__tests__/utils/testUtil';
import { List } from 'immutable';
import ObjectList from '../ObjectList';
import React from 'react';

describe('ObjectList', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render ObjectList with no object', () => {
    const { component } = reduxMount(
      <ObjectList
        objects={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
        bucketInfo={BUCKET_INFO}
      />,
    );

    expect(component.find('Row')).toHaveLength(0);
  });

  it('should render ObjectList with objects', () => {
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
        bucketInfo={BUCKET_INFO}
      />,
    );

    const rows = component.find('Row');
    expect(rows).toHaveLength(1);
    const cells = rows.find('td').children();
    expect(
      cells
        .at(0)
        .find('input')
        .prop('checked'),
    ).toBe(false);
    expect(cells.at(1).prop('value')).toBe('object1');
    expect(cells.at(2).prop('value')).toBe('Wed Oct 17 2020 10:35:57');
    expect(
      cells
        .at(3)
        .find('PrettyBytes')
        .text(),
    ).toBe('213 B');
  });

  it('should call openObjectUploadModal by clicking on upload button', () => {
    const openObjectUploadModalSpy = jest.spyOn(
      s3object,
      'openObjectUploadModal',
    );

    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
        bucketInfo={BUCKET_INFO}
      />,
    );

    component.find('button#object-list-upload-button').simulate('click');
    expect(openObjectUploadModalSpy).toHaveBeenCalledTimes(1);
  });

  it('should call openFolderCreateModal by clicking on createFolder button', () => {
    const openFolderCreateModalSpy = jest.spyOn(
      s3object,
      'openFolderCreateModal',
    );

    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
        bucketInfo={BUCKET_INFO}
      />,
    );

    component.find('button#object-list-create-folder-button').simulate('click');
    expect(openFolderCreateModalSpy).toHaveBeenCalledTimes(1);
  });

  it('Delete button should be disable if no object has been toggled', () => {
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
        bucketInfo={BUCKET_INFO}
      />,
    );

    expect(
      component.find('button#object-list-delete-button').prop('disabled'),
    ).toBe(true);
  });

  it('Delete button should be enable and should call openObjectDeleteModal when is pressed', () => {
    const openObjectDeleteModalSpy = jest.spyOn(
      s3object,
      'openObjectDeleteModal',
    );

    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List([FIRST_FORMATTED_OBJECT])}
        bucketInfo={BUCKET_INFO}
      />,
    );

    const deleteButton = component.find('button#object-list-delete-button');
    expect(deleteButton.prop('disabled')).toBe(false);
    deleteButton.simulate('click');
    expect(openObjectDeleteModalSpy).toHaveBeenCalledTimes(1);
  });

  it('should select all objects when ticking checkbox square', () => {
    const toggleAllObjectsSpy = jest.spyOn(s3object, 'toggleAllObjects');

    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
        bucketInfo={BUCKET_INFO}
      />,
    );

    checkBox(component, 'objectsHeaderCheckbox', true);
    expect(toggleAllObjectsSpy).toHaveBeenCalledTimes(1);
  });

  it('one object should be selected and the other one not and should render all the details of each objects', () => {
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT, SECOND_FORMATTED_OBJECT])}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        toggled={List()}
        bucketInfo={BUCKET_INFO}
      />,
    );

    const rows = component.find('Row');
    expect(rows).toHaveLength(2);
    rows.forEach((row, index) => {
      const cells = row.find('td').children();
      expect(
        cells
          .at(0)
          .find('input')
          .prop('checked'),
      ).toBe(index !== 0);
      expect(cells.at(1).prop('value')).toBe(
        index === 0 ? 'object1' : 'object2',
      );
      expect(cells.at(2).prop('value')).toBe(
        index === 0 ? 'Wed Oct 17 2020 10:35:57' : 'Wed Oct 17 2020 16:35:57',
      );
      expect(
        cells
          .at(3)
          .find('PrettyBytes')
          .text(),
      ).toBe(index === 0 ? '213 B' : '120 KiB');
    });
  });

  it('should enable versioning toggle if versioning enabled', () => {
    const bucketInfo = {
      ...BUCKET_INFO,
      isVersioning: true,
      versioning: 'Enabled',
    };
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
        bucketInfo={bucketInfo}
      />,
    );

    const toggle = component.find('ToggleSwitch#list-versions-toggle');
    expect(toggle.prop('disabled')).toBe(false);
  });

  it('should enable versioning toggle if versioning suspended', () => {
    const bucketInfo = {
      ...BUCKET_INFO,
      isVersioning: false,
      versioning: 'Suspended',
    };
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
        bucketInfo={bucketInfo}
      />,
    );

    const toggle = component.find('ToggleSwitch#list-versions-toggle');
    expect(toggle.prop('disabled')).toBe(false);
  });

  it('should disable versioning toggle if listing metadata', () => {
    const bucketInfo = {
      ...BUCKET_INFO,
      isVersioning: true,
      versioning: 'Enabled',
    };
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_METADATA_TYPE}
        bucketInfo={bucketInfo}
      />,
    );

    const toggle = component.find('ToggleSwitch#list-versions-toggle');
    expect(toggle.prop('disabled')).toBe(true);
  });

  it('should disable versioning toggle if bucket versioning disabled', () => {
    const { component } = reduxMount(
      <ObjectList
        objects={List([FIRST_FORMATTED_OBJECT])}
        toggled={List()}
        bucketName={BUCKET_NAME}
        prefixWithSlash=""
        listType={LIST_OBJECTS_S3_TYPE}
        bucketInfo={BUCKET_INFO}
      />,
    );

    const toggle = component.find('ToggleSwitch#list-versions-toggle');
    expect(toggle.prop('disabled')).toBe(true);
  });
});
