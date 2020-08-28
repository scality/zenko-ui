import * as actions from '../account';
import * as dispatchAction from './utils/dispatchActionsList';

import {
    authenticatedUserState,
    errorManagementState,
    initState,
    mockStore,
    testActionFunction,
    testDispatchFunction,
} from './utils/testUtil';

const createAccountNetworkAction = dispatchAction.NETWORK_START_ACTION('Creating account');
const deleteAccountNetworkAction = dispatchAction.NETWORK_START_ACTION('Deleting account');
const listBucketsNetworkAction = dispatchAction.NETWORK_START_ACTION('Listing buckets');

describe('account actions', () => {
    const syncTests = [
        {
            it: 'should return OPEN_ACCOUNT_DELETE_DIALOG action',
            fn: actions.openAccountDeleteDialog(),
            expectedActions: [dispatchAction.OPEN_ACCOUNT_DELETE_DIALOG_ACTION],
        },
        {
            it: 'should return CLOSE_ACCOUNT_DELETE_DIALOG action',
            fn: actions.closeAccountDeleteDialog(),
            expectedActions: [dispatchAction.CLOSE_ACCOUNT_DELETE_DIALOG_ACTION],
        },
    ];

    syncTests.forEach(testActionFunction);

    // Did not use "asyncTests loop" for this test because of SET_S3_CLIENT.s3Client
    it('createAccount: should return expected actions', () => {
        const store = mockStore()(authenticatedUserState());

        return store.dispatch(actions.createAccount({ userName: 'bart', email: 'test@test.com' }))
            .then(() => {
                const actions = store.getActions();
                expect(actions[0]).toEqual(createAccountNetworkAction);
                expect(actions[1].type).toEqual('SET_S3_CLIENT');
                expect(actions[2]).toEqual(listBucketsNetworkAction);
                expect(actions[3]).toEqual(dispatchAction.LIST_BUCKETS_SUCCESS_ACTION);
                expect(actions[4]).toEqual(dispatchAction.NETWORK_END_ACTION);
                expect(actions[5]).toEqual(dispatchAction.CONFIGURATION_VERSION_ACTION);
                expect(actions[6]).toEqual(dispatchAction.LOCATION_PUSH_ACTION('/accounts/bart'));
                expect(actions[7]).toEqual(dispatchAction.NETWORK_END_ACTION);
            })
            .catch(error => {
                throw new Error(`Expected success, but got error ${error.message}`);
            });
    });

    const asyncTests = [
        {
            it: 'createAccount: should handle error',
            fn: actions.createAccount({ userName: 'bart', email: 'test@test.com' }),
            storeState: errorManagementState(),
            expectedActions: [
                createAccountNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },

        {
            it: 'deleteAccount: should return expected actions',
            fn: actions.deleteAccount('bart'),
            storeState: initState,
            expectedActions: [
                deleteAccountNetworkAction,
                dispatchAction.CONFIGURATION_VERSION_ACTION,
                dispatchAction.LOCATION_PUSH_ACTION('/accounts'),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_ACCOUNT_DELETE_DIALOG_ACTION,
            ],
        },
        {
            it: 'deleteAccount: should handle error',
            fn: actions.deleteAccount('bart'),
            storeState: errorManagementState(),
            expectedActions: [
                deleteAccountNetworkAction,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('The server is temporarily unavailable.'),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_ACCOUNT_DELETE_DIALOG_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
