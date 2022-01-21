import * as s3object from '../../../actions/s3object';
import ObjectUpload, { FileList, NoFile } from '../ObjectUpload';
import { BUCKET_NAME } from '../../../actions/__tests__/utils/testUtil';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { reduxMount } from '../../../utils/test';
import router from 'react-router';

describe('ObjectUpload', () => {
  beforeAll(() => {
    jest.spyOn(router, 'useLocation').mockReturnValue({
      pathname: '/buckets/test/objects',
    });
  });
  const closeObjectUploadModalMock = jest.spyOn(
    s3object,
    'closeObjectUploadModal',
  );
  const uploadFilesMock = jest.spyOn(s3object, 'uploadFiles');

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render ObjectUpload component', () => {
    const { component } = reduxMount(
      <ObjectUpload bucketName={BUCKET_NAME} />,
      {
        uiObjects: {
          showObjectUpload: true,
        },
      },
    );

    expect(component.find(ObjectUpload).isEmptyRender()).toBe(false);
  });

  it('should render an empty ObjectUpload component if showFolderCreate equals to false', () => {
    const { component } = reduxMount(
      <ObjectUpload bucketName={BUCKET_NAME} />,
      {
        uiObjects: {
          showObjectUpload: false,
        },
      },
    );

    expect(component.find(ObjectUpload).isEmptyRender()).toBe(true);
  });

  it('should call closeObjectUploadModal if cancel button is pressed when NoFile component is rendered', () => {
    const closeObjectUploadModalMock = jest.spyOn(
      s3object,
      'closeObjectUploadModal',
    );

    const { component } = reduxMount(
      <ObjectUpload bucketName={BUCKET_NAME} />,
      {
        uiObjects: {
          showObjectUpload: true,
        },
      },
    );

    expect(component.find(NoFile)).toHaveLength(1);
    expect(component.find(FileList)).toHaveLength(0);

    expect(closeObjectUploadModalMock).toHaveBeenCalledTimes(0);
    component.find('button#object-upload-cancel-button').simulate('click');
    expect(closeObjectUploadModalMock).toHaveBeenCalledTimes(1);
  });

  it('should not call uploadFiles if upload button is pressed when no file is present', () => {
    const uploadFilesMock = jest.spyOn(s3object, 'uploadFiles');

    const { component } = reduxMount(
      <ObjectUpload bucketName={BUCKET_NAME} />,
      {
        uiObjects: {
          showObjectUpload: true,
        },
      },
    );

    const uploadButton = component.find('button#object-upload-upload-button');
    expect(uploadFilesMock).toHaveBeenCalledTimes(0);
    expect(uploadButton.prop('disabled')).toBe(true);
    uploadButton.simulate('click');
    expect(uploadFilesMock).toHaveBeenCalledTimes(0);
  });

  it('should render NoFile component', () => {
    const { component } = reduxMount(
      <ObjectUpload bucketName={BUCKET_NAME} />,
      {
        uiObjects: {
          showObjectUpload: true,
        },
      },
    );

    expect(component.find(NoFile)).toHaveLength(1);
    expect(component.find(FileList)).toHaveLength(0);
  });

  const tests = [
    'should render FileList component',
    'should call closeObjectUploadModal if cancel button is pressed when FileList component is rendered',
    'should call uploadFile if upload button is pressed  when FileList component is rendered',
    'should remove file when pressing the cross and render NoFile when no file is present',
  ];

  tests.forEach((t, index) => {
    it(t, async () => {
      const { component } = reduxMount(
        <ObjectUpload bucketName={BUCKET_NAME} />,
        {
          uiObjects: {
            showObjectUpload: true,
          },
        },
      );

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const dropZone = component.find('input.object-upload-drop-zone-input');
      expect(component.find(FileList)).toHaveLength(0);

      await act(async () => {
        dropZone.simulate('change', { target: { files: [file] } });
      });

      component.update();

      switch (index) {
        case 0:
          expect(component.find(NoFile)).toHaveLength(0);
          expect(component.find(FileList)).toHaveLength(1);
          break;
        case 1:
          expect(component.find(NoFile)).toHaveLength(0);
          expect(component.find(FileList)).toHaveLength(1);
          expect(closeObjectUploadModalMock).toHaveBeenCalledTimes(0);
          component
            .find('button#object-upload-cancel-button')
            .simulate('click');
          expect(closeObjectUploadModalMock).toHaveBeenCalledTimes(1);
          break;
        case 2:
          expect(component.find(FileList)).toHaveLength(1);
          expect(
            component
              .find('td')
              .at(0)
              .find('div')
              .childAt(0)
              .text(),
          ).toBe('test.txt');
          expect(
            component
              .find('td')
              .at(0)
              .find('small')
              .text(),
          ).toBe('4 B');
          expect(
            component
              .find('div.sc-modal-header')
              .find('span')
              .text(),
          ).toBe('Upload 1 file');
          expect(uploadFilesMock).toHaveBeenCalledTimes(0);
          component
            .find('button#object-upload-upload-button')
            .simulate('click');
          expect(uploadFilesMock).toHaveBeenCalledTimes(1);
          break;
        case 3:
          expect(component.find(FileList)).toHaveLength(1);
          component
            .find('td')
            .at(1)
            .find('div')
            .simulate('click');
          expect(component.find(FileList)).toHaveLength(0);
          expect(component.find(NoFile)).toHaveLength(1);
          break;
      }
    });
  });
});
