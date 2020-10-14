import * as s3object from '../../../actions/s3object';
import { BUCKET_NAME, FILE_NAME } from '../../../actions/__tests__/utils/testUtil';
import FolderCreate from '../FolderCreate';
import React from 'react';
import { reduxMount } from '../../../utils/test';

describe('FolderCreate', () => {
    it('should render FolderCreate component', () => {
        const { component } = reduxMount(<FolderCreate bucketName={BUCKET_NAME} prefixWithSlash=''/>, {
            uiObjects: {
                showFolderCreate: true,
            },
        });

        expect(component.find(FolderCreate).isEmptyRender()).toBe(false);
    });

    it('should render an empty FolderCreate component if showFolderCreate equals to false', () => {
        const { component } = reduxMount(<FolderCreate bucketName={BUCKET_NAME} prefixWithSlash=''/>, {
            uiObjects: {
                showFolderCreate: false,
            },
        });

        expect(component.find(FolderCreate).isEmptyRender()).toBe(true);
    });


    it('should call closeFolderCreateModal if cancel button is pressed', async () => {
        const closeFolderCreateModalMock = jest.spyOn(s3object, 'closeFolderCreateModal');

        const { component } = reduxMount(<FolderCreate bucketName={BUCKET_NAME} prefixWithSlash=''/>, {
            uiObjects: {
                showFolderCreate: true,
            },
        });

        expect(closeFolderCreateModalMock).toHaveBeenCalledTimes(0);
        component.find('button#folder-create-cancel-button').simulate('click');
        expect(closeFolderCreateModalMock).toHaveBeenCalledTimes(1);
    });

    it('should not createFolder if save button is pressed and folderName is empty', () => {
        const createFolderMock = jest.spyOn(s3object, 'createFolder');

        const { component } = reduxMount(<FolderCreate bucketName={BUCKET_NAME} prefixWithSlash=''/>, {
            uiObjects: {
                showFolderCreate: true,
            },
        });

        expect(createFolderMock).toHaveBeenCalledTimes(0);
        component.find('button#folder-create-save-button').simulate('click');
        expect(createFolderMock).toHaveBeenCalledTimes(0);
    });

    it('should call createFolder if save button is pressed and folderName is not empty', () => {
        const createFolderMock = jest.spyOn(s3object, 'createFolder');

        const { component } = reduxMount(<FolderCreate bucketName={BUCKET_NAME} prefixWithSlash=''/>, {
            uiObjects: {
                showFolderCreate: true,
            },
        });

        const elementInput = component.find('input#folder-create-input');

        expect(createFolderMock).toHaveBeenCalledTimes(0);
        elementInput.simulate('change', { target: { value: FILE_NAME } });
        component.find('button#folder-create-save-button').simulate('click');
        expect(createFolderMock).toHaveBeenCalledTimes(1);
    });
});
