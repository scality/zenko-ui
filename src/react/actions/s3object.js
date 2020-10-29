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
import type { CommonPrefix, File, HeadObjectResponse, MetadataPairs, S3Object, TagSet } from '../../types/s3';
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

export function getObjectMetadataSuccess(bucketName: string, prefixWithSlash: string, objectKey: string, info: HeadObjectResponse, tags: TagSet): GetObjectMetadataSuccessAction {
    return {
        type: 'GET_OBJECT_METADATA_SUCCESS',
        bucketName,
        prefixWithSlash,
        objectKey,
        info,
        tags,
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
        const { zenkoClient } = getClients(getState());
        dispatch(networkStart('Creating folder'));
        return zenkoClient.createFolder(bucketName, prefixWithSlash, folderName)
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
        const { zenkoClient } = getClients(getState());
        dispatch(networkStart('Listing objects'));
        return zenkoClient.listObjects(bucketName, prefixWithSlash)
            .then(res => {
                const list = res.Contents;
                list.forEach(object => object.SignedUrl = zenkoClient.getObjectSignedUrl(bucketName, object.Key));
                return dispatch(listObjectsSuccess(list, res.CommonPrefixes, res.Prefix));
            })
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function uploadFiles(bucketName: string, prefixWithSlash: string, files: Array<File>): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { zenkoClient } = getClients(getState());
        dispatch(closeObjectUploadModal());
        dispatch(networkStart('Uploading object(s)'));
        return zenkoClient.uploadObject(bucketName, prefixWithSlash, files)
            .then(() => dispatch(listObjects(bucketName, prefixWithSlash)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function deleteFiles(bucketName: string, prefixWithSlash: string, objects: Array<any>): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { zenkoClient } = getClients(getState());
        dispatch(closeObjectDeleteModal());
        dispatch(networkStart('Deleting object(s)'));
        return zenkoClient.deleteObjects(bucketName, objects)
            .then(() => dispatch(listObjects(bucketName, prefixWithSlash)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function getObjectMetadata(bucketName: string, prefixWithSlash: string, objectKey: string): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { zenkoClient } = getClients(getState());
        dispatch(networkStart('Getting object metadata'));
        return Promise.all([
            zenkoClient.headObject(bucketName, objectKey),
            zenkoClient.getObjectTagging(bucketName, objectKey),
        ])
            .then(([info, tags]) => dispatch(getObjectMetadataSuccess(bucketName, prefixWithSlash, objectKey, info, tags.TagSet)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function putObjectMetadata(bucketName: string, prefixWithSlash: string, objectKey: string, systemMetadata: MetadataPairs, userMetadata: MetadataPairs): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { zenkoClient } = getClients(getState());
        dispatch(networkStart('Getting object metadata'));
        return zenkoClient.putObjectMetadata(bucketName, objectKey, systemMetadata, userMetadata)
            .then(() => dispatch(getObjectMetadata(bucketName, prefixWithSlash, objectKey)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function putObjectTagging(bucketName: string, prefixWithSlash: string, objectKey: string, tags: TagSet): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { zenkoClient } = getClients(getState());
        dispatch(networkStart('Getting object tags'));
        return zenkoClient.putObjectTagging(bucketName, objectKey, tags)
            .then(() => dispatch(getObjectMetadata(bucketName, prefixWithSlash, objectKey)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}
