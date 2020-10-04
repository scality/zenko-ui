// @flow
import type {
    CloseFolderCreateModalAction,
    CloseObjectDeleteModalAction,
    CloseObjectUploadModalAction,
    ListObjectsSuccessAction,
    OpenFolderCreateModalAction,
    OpenObjectDeleteModalAction,
    OpenObjectUploadModalAction,
    ThunkStatePromisedAction,
    ToggleAllObjectsAction,
    ToggleObjectAction,
} from '../../types/actions';
import type { CommonPrefix, File, S3Object } from '../../types/s3';
import { handleApiError, handleS3Error } from './error';
import { networkEnd, networkStart } from './network';
import { getClients } from '../utils/actions';

export function listObjectsSuccess(contents: Array<S3Object>, commonPrefixes: Array<CommonPrefix>, prefix: string): ListObjectsSuccessAction {
    return {
        type: 'LIST_OBJECTS_SUCCESS',
        contents,
        commonPrefixes,
        prefix,
    };
}

export function openFolderCreateModal(): OpenFolderCreateModalAction {
    return {
        type: 'OPEN_FOLDER_CREATE_MODAL',
    };
}

export function closeFolderCreateModal(): CloseFolderCreateModalAction {
    return {
        type: 'CLOSE_FOLDER_CREATE_MODAL',
    };
}

export function openObjectUploadModal(): OpenObjectUploadModalAction {
    return {
        type: 'OPEN_OBJECT_UPLOAD_MODAL',
    };
}

export function closeObjectUploadModal(): CloseObjectUploadModalAction {
    return {
        type: 'CLOSE_OBJECT_UPLOAD_MODAL',
    };
}

export function openObjectDeleteModal(): OpenObjectDeleteModalAction {
    return {
        type: 'OPEN_OBJECT_DELETE_MODAL',
    };
}

export function closeObjectDeleteModal(): CloseObjectDeleteModalAction {
    return {
        type: 'CLOSE_OBJECT_DELETE_MODAL',
    };
}

export function toggleObject(objectName: string): ToggleObjectAction {
    return {
        type: 'TOGGLE_OBJECT',
        objectName,
    };
}

export function toggleAllObjects(toggled: boolean): ToggleAllObjectsAction {
    return {
        type: 'TOGGLE_ALL_OBJECTS',
        toggled,
    };
}

export function createFolder(bucketName: string, prefixWithSlash: string, folderName: string): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { s3Client } = getClients(getState());
        dispatch(networkStart('Creating folder'));
        return s3Client.createFolder(bucketName, prefixWithSlash, folderName)
            .then(() => dispatch(listObjects(bucketName, prefixWithSlash)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => {
                dispatch(networkEnd());
                dispatch(closeFolderCreateModal());
            });
    };
}

export function listObjects(bucketName: string, prefixWithSlash: string): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { s3Client } = getClients(getState());
        dispatch(networkStart('Listing objects'));
        return s3Client.listObjects(bucketName, prefixWithSlash)
            .then(res => {
                const list = res.Contents;
                list.forEach(object => object.SignedUrl = s3Client.getObjectSignedUrl(bucketName, object.Key));
                return dispatch(listObjectsSuccess(list, res.CommonPrefixes, res.Prefix));
            })
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function uploadFiles(bucketName: string, prefixWithSlash: string, files: Array<File>): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { s3Client } = getClients(getState());
        dispatch(closeObjectUploadModal());
        dispatch(networkStart('Uploading object(s)'));
        return s3Client.uploadObject(bucketName, prefixWithSlash, files)
            .then(() => dispatch(listObjects(bucketName, prefixWithSlash)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function deleteFiles(bucketName: string, prefixWithSlash: string, objects: Array<any>): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { s3Client } = getClients(getState());
        dispatch(closeObjectDeleteModal());
        dispatch(networkStart('Deleting object(s)'));
        return s3Client.deleteObjects(bucketName, objects)
            .then(() => dispatch(listObjects(bucketName, prefixWithSlash)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}
