import * as actions from '../s3bucket';
import * as dispatchAction from './utils/dispatchActionsList';
import {
    OWNER_NAME,
    errorS3State, initState, testDispatchFunction,
} from './utils/testUtil';

const createBucketNetworkAction = dispatchAction.NETWORK_START_ACTION('Creating bucket');
const listBucketsNetworkAction = dispatchAction.NETWORK_START_ACTION('Listing buckets');

describe('s3bucket actions', () => {
    const asyncTests = [
        {
            it: 'createBucket: should return expected actions',
            fn: actions.createBucket({
                name: 'azeaze',
                locationConstraint: {
                    value: 'us-east-1',
                },
            }),
            storeState: initState,
            expectedActions: [
                createBucketNetworkAction,
                listBucketsNetworkAction,
                dispatchAction.LIST_BUCKETS_SUCCESS_ACTION([], OWNER_NAME),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.LOCATION_PUSH_ACTION('/buckets'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'createBucket: should handle error',
            fn: actions.createBucket({
                name: 'azeaze',
                locationConstraint: {
                    value: 'us-east-1',
                },
            }),
            storeState: errorS3State(),
            expectedActions: [
                createBucketNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
