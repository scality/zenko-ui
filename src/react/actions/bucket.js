import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';

function updateBucketList(list) {
    return {
        type: 'UPDATE_BUCKET_LIST',
        list,
    };
}

export function listBuckets(){
    return (dispatch, getState) => {
        const client = getState().s3Client.client;
        dispatch(networkStart('Listing buckets'));
        return client.listBucketsWithLocation()
            .then(res => dispatch(updateBucketList(res.Buckets)))
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}
