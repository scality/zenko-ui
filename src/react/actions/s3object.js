// @flow
import type {
    CloseFolderCreateModalAction,
    CloseObjectDeleteModalAction,
    CloseObjectUploadModalAction,
    GetObjectMetadataSuccessAction,
    ListObjectsSuccessAction,
    OpenFolderCreateModalAction,
    OpenObjectDeleteModalAction,
    OpenObjectUploadModalAction,
    ResetObjectMetadataAction,
    ThunkStatePromisedAction,
    ToggleAllObjectsAction,
    ToggleObjectAction,
} from '../../types/actions';
import type { CommonPrefix, File, HeadObjectResponse, S3Object } from '../../types/s3';
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

export function getObjectMetadataSuccess(bucketName: string, prefixWithSlash: string, objectKey: string, info: HeadObjectResponse): GetObjectMetadataSuccessAction {
    return {
        type: 'GET_OBJECT_METADATA_SUCCESS',
        bucketName,
        prefixWithSlash,
        objectKey,
        info,
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

export function resetObjectMetadata(): ResetObjectMetadataAction {
    return {
        type: 'RESET_OBJECT_METADATA',
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

export function getObjectMetadata(bucketName: string, prefixWithSlash: string, objectKey: string): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { s3Client } = getClients(getState());
        dispatch(networkStart('Getting object metadata'));
        return s3Client.headObject(bucketName, objectKey)
            .then(res => dispatch(getObjectMetadataSuccess(bucketName, prefixWithSlash, objectKey, res)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function putObjectMetadata(bucketName: string, prefixWithSlash: string, objectKey: string, metadata: { [string]: string }): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { s3Client } = getClients(getState());
        dispatch(networkStart('Getting object metadata'));
        return s3Client.putObjectMetadata(bucketName, objectKey, metadata)
            .then(() => dispatch(getObjectMetadata(bucketName, prefixWithSlash, objectKey)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}
