// @flow
import type {
    CloseFolderCreateModalAction,
    ListObjectsSuccessAction,
    OpenFolderCreateModalAction,
    ThunkStatePromisedAction,
} from '../../types/actions';
import type { CommonPrefix, S3Object } from '../../types/s3';
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
        return s3Client.listObjects( bucketName, prefixWithSlash )
            .then(res => dispatch(listObjectsSuccess(res.Contents, res.CommonPrefixes, res.Prefix)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}
