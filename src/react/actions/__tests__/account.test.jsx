import * as actions from '../account';
import * as dispatchAction from './utils/dispatchActionsList';

import {
    ACCOUNT,
    errorManagementState,
    initState,
    testActionFunction,
    testDispatchFunction,
} from './utils/testUtil';

const createAccountNetworkAction = dispatchAction.NETWORK_START_ACTION('Creating account');

describe('account actions', () => {
    const syncTests = [
        {
            it: 'should return DISPLAY_ACCOUNT action',
            fn: actions.displayAccount(ACCOUNT),
            expectedActions: [dispatchAction.DISPLAY_ACCOUNT_ACTION],
        },
    ];

    syncTests.forEach(testActionFunction);

    const asyncTests = [
        {
            it: 'createAccount: should return expected actions',
            fn: actions.createAccount({ username: 'bart', email: 'test@test.com' }),
            storeState: initState,
            expectedActions: [
                createAccountNetworkAction,
                dispatchAction.CONFIGURATION_VERSION_ACTION,
                dispatchAction.LOCATION_PUSH_ACTION('/accounts'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'createAccount: should handle error',
            fn: actions.createAccount({ username: 'bart', email: 'test@test.com' }),
            storeState: errorManagementState(),
            expectedActions: [
                createAccountNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
