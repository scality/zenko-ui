import * as s3object from '../../../actions/s3object';
import {
  BUCKET_NAME,
  S3_OBJECT,
} from '../../../actions/__tests__/utils/testUtil';
import { BUCKET_INFO } from './utils/testUtil';
import { List } from 'immutable';
import ObjectDelete from '../ObjectDelete';
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
