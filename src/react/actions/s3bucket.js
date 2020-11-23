// @flow
import type { BucketInfo, CreateBucketRequest, S3Bucket } from '../../types/s3';
import type {
    CloseBucketDeleteDialogAction,
    GetBucketInfoSuccess,
    ListBucketsSuccessAction,
    OpenBucketDeleteDialogAction,
    ThunkStatePromisedAction,
} from '../../types/actions';
import { handleApiError, handleS3Error } from './error';
import { networkEnd, networkStart } from './network';
import { getClients } from '../utils/actions';
import { push } from 'connected-react-router';

export function listBucketsSuccess(list: Array<S3Bucket> , ownerName: string): ListBucketsSuccessAction {
    return {
        type: 'LIST_BUCKETS_SUCCESS',
        list,
        ownerName,
    };
}

export function getBucketInfoSuccess(info: BucketInfo): GetBucketInfoSuccess {
    return {
        type: 'GET_BUCKET_INFO_SUCCESS',
        info,
    };
}

export function openBucketDeleteDialog(bucketName: string): OpenBucketDeleteDialogAction {
    return {
        type: 'OPEN_BUCKET_DELETE_DIALOG',
        bucketName,
    };
}

export function closeBucketDeleteDialog(): CloseBucketDeleteDialogAction {
    return {
        type: 'CLOSE_BUCKET_DELETE_DIALOG',
    };
}

export function listBuckets(): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { zenkoClient } = getClients(getState());
        dispatch(networkStart('Listing buckets'));
        return zenkoClient.listBucketsWithLocation()
            .then(res => dispatch(listBucketsSuccess(res.Buckets, res.Owner.DisplayName)))
            //!\ errors will have to be handled by caller
            .catch(error => { throw error; })
            .finally(() => dispatch(networkEnd()));
    };
}

export function createBucket(bucket: CreateBucketRequest): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        // TODO: credentials expired => zenkoClient out of date => zenkoClient.createBucket error.
        const { zenkoClient } = getClients(getState());
        dispatch(networkStart('Creating bucket'));
        return zenkoClient.createBucket(bucket)
            .then(() => dispatch(listBuckets()))
            .then(() => dispatch(push('/buckets')))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function deleteBucket(bucketName: string): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { zenkoClient } = getClients(getState());
        dispatch(networkStart('Deleting bucket'));
        return zenkoClient.deleteBucket(bucketName)
            .then(() => dispatch(listBuckets()))
            .then(() => dispatch(push('/buckets')))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => {
                dispatch(networkEnd());
                dispatch(closeBucketDeleteDialog());
            });
    };
}

export function getBucketInfo(bucketName: string): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { zenkoClient } = getClients(getState());
        dispatch(networkStart('Getting bucket information'));
        return zenkoClient.getBucketInfo(bucketName)
            .then(info => dispatch(getBucketInfoSuccess(info)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function toggleBucketVersioning(bucketName: string, isVersioning: boolean): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { zenkoClient } = getClients(getState());
        dispatch(networkStart('Versioning bucket'));
        return zenkoClient.toggleVersioning(bucketName, isVersioning)
            .then(() => dispatch(getBucketInfo(bucketName)))
            .catch(error => dispatch(handleS3Error(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}
