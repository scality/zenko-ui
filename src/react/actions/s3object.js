// @flow
import type { CommonPrefix, S3Object } from '../../types/s3';
import type {
    ListObjectsSuccessAction,
    ThunkStatePromisedAction,
} from '../../types/actions';
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

export function listObjects(bucketName: string, prefix: string): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { s3Client } = getClients(getState());
        dispatch(networkStart('Listing objects'));
        return s3Client.listObjects({ bucketName, prefix })
            .then(res => dispatch(listObjectsSuccess(res.Contents, res.CommonPrefixes, res.Prefix)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}
