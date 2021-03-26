import * as actions from '../account';
import * as dispatchAction from './utils/dispatchActionsList';

import {
    ACCOUNT,
    ACCOUNT_ACCESS_KEYS,
    authenticatedUserState,
    errorManagementState,
    initState,
    testActionFunction,
    testDispatchFunction,
} from './utils/testUtil';

const createAccountNetworkAction = dispatchAction.NETWORK_START_ACTION('Creating account');
const deleteAccountNetworkAction = dispatchAction.NETWORK_START_ACTION('Deleting account');

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
        {
            it: 'should return SELECT_ACCOUNT action',
            fn: actions.selectAccount(ACCOUNT),
            expectedActions: [dispatchAction.SELECT_ACCOUNT_ACTION],
        },
        {
            it: 'should return LIST_ACCOUNT_ACCESS_KEY_SUCCESS action',
            fn: actions.listAccountAccessKeySuccess(ACCOUNT_ACCESS_KEYS),
            expectedActions: [dispatchAction.LIST_ACCOUNT_ACCESS_KEY_SUCCESS_ACTION],
        },
    ];

    syncTests.forEach(testActionFunction);

    const asyncTests = [
        {
            it: 'createAccount: should return expected actions',
            fn: actions.createAccount({ userName: 'bart', email: 'test@test.com' }),
            storeState: authenticatedUserState(),
            expectedActions: [
                createAccountNetworkAction,
                dispatchAction.CONFIGURATION_VERSION_ACTION,
                dispatchAction.LOCATION_PUSH_ACTION('/accounts/bart'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'createAccount: should handle error',
            fn: actions.createAccount({ userName: 'bart', email: 'test@test.com' }),
            storeState: errorManagementState(),
            expectedActions: [
                createAccountNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('Management API Error Response'),
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
                dispatchAction.CLOSE_ACCOUNT_DELETE_DIALOG_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'deleteAccount: should handle error',
            fn: actions.deleteAccount('bart'),
            storeState: errorManagementState(),
            expectedActions: [
                deleteAccountNetworkAction,
                dispatchAction.CLOSE_ACCOUNT_DELETE_DIALOG_ACTION,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('Management API Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
