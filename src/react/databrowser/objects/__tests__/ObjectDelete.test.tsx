import * as s3object from '../../../actions/s3object';
import {
  BUCKET_NAME,
  S3_OBJECT,
} from '../../../actions/__tests__/utils/testUtil';
import { BUCKET_INFO } from './utils/testUtil';
import { List } from 'immutable';
import ObjectDelete, { getMessagesAndRequiredActions } from '../ObjectDelete';
import React from 'react';
import { reduxMount } from '../../../utils/test';
import { act } from 'react-dom/test-utils';
describe('ObjectDelete', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should render ObjectDelete component', () => {
    const { component } = reduxMount(
      <ObjectDelete
        bucketName={BUCKET_NAME}
        toggled={[S3_OBJECT]}
        bucketInfo={BUCKET_INFO}
        prefixWithSlash=""
      />,
      {
        uiObjects: {
          showObjectDelete: true,
        },
      },
    );
    expect(component.find(ObjectDelete).isEmptyRender()).toBe(false);
  });
  it('should render an empty ObjectDelete component if showObjectDelete equals to false', () => {
    const { component } = reduxMount(
      <ObjectDelete
        bucketName={BUCKET_NAME}
        toggled={List([S3_OBJECT])}
        bucketInfo={BUCKET_INFO}
        prefixWithSlash=""
      />,
      {
        uiObjects: {
          showObjectDelete: false,
        },
      },
    );
    expect(component.find(ObjectDelete).isEmptyRender()).toBe(true);
  });
  it('should call closeObjectDeleteModal and toggleAllObjects if cancel button is pressed', () => {
    const closeObjectDeleteModalSpy = jest.spyOn(
      s3object,
      'closeObjectDeleteModal',
    );
    const toggleAllObjectsSpy = jest.spyOn(s3object, 'toggleAllObjects');
    const { component } = reduxMount(
      <ObjectDelete
        bucketName={BUCKET_NAME}
        toggled={List([S3_OBJECT])}
        bucketInfo={BUCKET_INFO}
        prefixWithSlash=""
      />,
      {
        uiObjects: {
          showObjectDelete: true,
        },
      },
    );
    expect(closeObjectDeleteModalSpy).toHaveBeenCalledTimes(0);
    expect(toggleAllObjectsSpy).toHaveBeenCalledTimes(0);
    component.find('button#object-delete-cancel-button').simulate('click');
    expect(closeObjectDeleteModalSpy).toHaveBeenCalledTimes(1);
    expect(toggleAllObjectsSpy).toHaveBeenCalledTimes(1);
  });
  it('should call deleteFiles if delete button is pressed', () => {
    const deleteFilesSpy = jest.spyOn(s3object, 'deleteFiles');
    const { component } = reduxMount(
      <ObjectDelete
        bucketName={BUCKET_NAME}
        toggled={List([S3_OBJECT])}
        bucketInfo={BUCKET_INFO}
        prefixWithSlash=""
      />,
      {
        uiObjects: {
          showObjectDelete: true,
        },
      },
    );
    const checkbox = component.find('input#confirmingPemanentDeletionCheckbox');
    act(() => checkbox.props().onChange());
    expect(deleteFilesSpy).toHaveBeenCalledTimes(0);
    component.find('button#object-delete-delete-button').simulate('click');
    expect(deleteFilesSpy).toHaveBeenCalledTimes(1);
  });
});

describe.only('getMessagesAndRequiredActions', () => {
  //Singular messages tests
  it('should display permanently removal info banner when removing an object on a non versioned bucket', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: false,
      numberOfObjects: 1,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 0,
      selectedObjectsAreSpecificVersions: false,
    });
    expect(result).toStrictEqual({
      info: 'The selected object will be permanently deleted.',
      warnings: [],
      checkboxRequired: true,
      confirmationRequired: false,
    });
  });

  it('should display delete marker info banner when removing the default version of a versioned object', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 1,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 0,
      selectedObjectsAreSpecificVersions: false,
    });
    expect(result).toStrictEqual({
      info: 'A delete marker will be added to the object.',
      warnings: [],
      checkboxRequired: false,
      confirmationRequired: false,
    });
  });

  it('should display permanently removal info banner when removing a specific version of a versioned object', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 1,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 0,
      selectedObjectsAreSpecificVersions: true,
    });
    expect(result).toStrictEqual({
      info: 'The selected version will be permanently deleted.',
      warnings: [],
      checkboxRequired: true,
      confirmationRequired: false,
    });
  });

  it('should display delete marker info banner when removing the default version of a versioned locked object in Governance Mode', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 1,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 1,
      selectedObjectsAreSpecificVersions: true,
    });
    expect(result).toStrictEqual({
      info: 'A delete marker will be added to the object.',
      warnings: [],
      checkboxRequired: true,
      confirmationRequired: false,
    });
  });

  it('should display delete marker info banner when removing the default version of a versioned locked object in Compliance Mode', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 1,
      objectsLockedInComplianceModeLength: 1,
      objectsLockedInGovernanceModeLength: 0,
      selectedObjectsAreSpecificVersions: true,
    });
    expect(result).toStrictEqual({
      info: 'The selected version will be permanently deleted.',
      warnings: [
        'By confirming, you indicate that you want to bypass the governance retention protecting objects.',
      ],
      checkboxRequired: true,
      confirmationRequired: false,
    });
  });

  it('should display permanently removal warning banner when removing a specific version of a versioned locked object in Governance Mode', () => {});

  it('should display impossible removal warning banner when removing a specific version of a versioned locked object in Compliance Mode', () => {});

  it('should display impossible removal warning banner when removing a specific version of a versioned locked object with legal hold', () => {});

  //Plural messages tests
  it('should display permanently removal plural info banner when removing some object on a non versioned bucket', () => {});

  it('should display delete marker plural info banner when removing the default version of some versioned object', () => {});

  it('should display permanently removal plural info banner when removing a specific version of some versioned object', () => {});

  it('should display delete marker plural info banner when removing the default version of some versioned locked object in Governance Mode', () => {});

  it('should display delete marker plural info banner when removing the default version of some versioned locked object in Compliance Mode', () => {});

  it('should display permanently removal plural warning banner when removing a specific version of some versioned locked object in Governance Mode', () => {});

  it('should display impossible removal plural warning banner when removing a specific version of some versioned locked object in Compliance Mode', () => {});

  it('should display impossible removal plural warning banner when removing a specific version of some versioned locked object with legal hold', () => {});

  it('should display all warning messages when deleting locked object in several mode and non locked objects', () => {});
});
