// @flow
import type {
    ListBucketsSuccessAction,
    ThunkStatePromisedAction,
} from '../../types/actions';
import { networkEnd, networkStart } from './network';
import type { S3Bucket } from '../../types/s3';
import { getClients } from '../utils/actions';

export function listBucketsSuccess(list: Array<S3Bucket> , ownerName: string): ListBucketsSuccessAction {
    return {
        type: 'LIST_BUCKETS_SUCCESS',
        list,
        ownerName,
    };
}

// export function openBucketDeleteDialog() {
//     return {
//         type: 'OPEN_BUCKET_DELETE_DIALOG',
//     };
// }
//
// export function closeBucketDeleteDialog() {
//     return {
//         type: 'CLOSE_BUCKET_DELETE_DIALOG',
//     };
// }

export function listBuckets(): ThunkStatePromisedAction{
    return (dispatch, getState) => {
        const { s3Client } = getClients(getState());
        dispatch(networkStart('Listing buckets'));
        return s3Client.listBucketsWithLocation()
            .then(res => dispatch(listBucketsSuccess(res.Buckets, res.Owner.DisplayName)))
            //!\ errors will have to be handled by caller
            .catch(error => { throw error; })
            .finally(() => dispatch(networkEnd()));
    };
}

// export function createBucket(bucket){
//     return (dispatch, getState) => {
//         const { s3Client } = getClients(getState());
//         dispatch(networkStart('Creating bucket'));
//         return s3Client.createBucket(bucket)
//             .then(() => {
//                 batch(() => {
//                     dispatch(push('/databrowser'));
//                     dispatch(listBuckets());
//                 });
//             })
//             .catch(error => dispatch(handleS3Error(error)))
//             .catch(error => dispatch(handleApiError(error, 'byModal')))
//             .finally(() => dispatch(networkEnd()));
//     };
// }
//
// export function deleteBucket(bucketName){
//     return (dispatch, getState) => {
//         const { s3Client } = getClients(getState());
//         dispatch(closeBucketDeleteDialog());
//         dispatch(networkStart('Deleting bucket'));
//         return s3Client.deleteBucket(bucketName)
//             .then(() => dispatch(listBuckets()))
//             .catch(error => dispatch(handleS3Error(error)))
//             .catch(error => dispatch(handleApiError(error, 'byModal')))
//             .finally(() => dispatch(networkEnd()));
//     };
// }
