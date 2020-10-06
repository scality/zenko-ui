import * as actions from '../s3bucket';
import * as dispatchAction from './utils/dispatchActionsList';
import {
    OWNER_NAME, authenticatedUserState,
    errorS3State, mockStore, testDispatchFunction,
} from './utils/testUtil';

const createBucketNetworkAction = dispatchAction.NETWORK_START_ACTION('Creating bucket');
const listBucketsNetworkAction = dispatchAction.NETWORK_START_ACTION('Listing buckets');

describe('s3bucket actions', () => {
    it('createBucket: should return expected actions', () => {
        const store = mockStore()(authenticatedUserState());

        return store.dispatch(actions.createBucket({ name: 'azeaze', locationConstraint: { value: 'us-east-1' } }))
            .then(() => {
                const actions = store.getActions();
                expect(actions[0]).toEqual(createBucketNetworkAction);
                expect(actions[1]).toEqual(listBucketsNetworkAction);
                expect(actions[2]).toEqual(dispatchAction.LIST_BUCKETS_SUCCESS_ACTION([], OWNER_NAME));
                expect(actions[3]).toEqual(dispatchAction.NETWORK_END_ACTION);
                expect(actions[4]).toEqual(dispatchAction.LOCATION_PUSH_ACTION('/buckets'));
                expect(actions[5]).toEqual(dispatchAction.NETWORK_END_ACTION);
            })
            .catch(error => {
                throw new Error(`Expected success, but got error ${error.message}`);
            });
    });

    const asyncTests = [
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
