import * as actions from '../auth';
import * as dispatchAction from './utils/dispatchActionsList';

import {
    APP_CONFIG,
    INSTANCE_ID,
    USER_MANAGER_ERROR_MSG,
    errorUserManagerState,
    initState,
    signinRedirectCallbackState,
    testActionFunction,
    testDispatchFunction,
} from './utils/testUtil';

import { MockManagementClient } from '../../../js/mock/managementClient';
import { MockS3Client } from '../../../js/mock/S3Client';
import { MockSTSClient } from '../../../js/mock/STSClient';
import { MockUserManager } from '../../../js/mock/userManager';

describe('auth actions', () => {
    const syncTests = [
        {
            it: 'should return SET_MANAGEMENT_CLIENT action',
            fn: actions.setManagementClient(new MockManagementClient),
            expectedActions: [dispatchAction.SET_MANAGEMENT_CLIENT_ACTION],
        },
        {
            it: 'should return SET_S3_CLIENT action',
            fn: actions.setS3Client(new MockS3Client),
            expectedActions: [dispatchAction.SET_S3_CLIENT_ACTION(new MockS3Client)],
        },
        {
            it: 'should return SET_STS_CLIENT action',
            fn: actions.setSTSClient(new MockSTSClient),
            expectedActions: [dispatchAction.SET_STS_CLIENT_ACTION],
        },
        {
            it: 'should return SET_USER_MANAGER action',
            fn: actions.setUserManager(new MockUserManager),
            expectedActions: [dispatchAction.SET_USER_MANAGER_ACTION],
        },
        {
            it: 'should return SET_APP_CONFIG action',
            fn: actions.setAppConfig(APP_CONFIG),
            expectedActions: [dispatchAction.SET_APP_CONFIG_ACTION],
        },
        {
            it: 'should return SELECT_INSTANCE action',
            fn: actions.selectInstance(INSTANCE_ID),
            expectedActions: [dispatchAction.SELECT_INSTANCE_ACTION],
        },
        {
            it: 'should return LOAD_USER_SUCCESS action',
            fn: actions.loadUserSuccess(),
            expectedActions: [dispatchAction.LOAD_USER_SUCCESS_ACTION],
        },
        {
            it: 'should return CONFIG_AUTH_FAILURE action',
            fn: actions.configAuthFailure(),
            expectedActions: [dispatchAction.CONFIG_AUTH_FAILURE_ACTION],
        },
        {
            it: 'should return SIGNOUT_START action',
            fn: actions.signoutStart(),
            expectedActions: [dispatchAction.SIGNOUT_START_ACTION],
        },
        {
            it: 'should return SIGNOUT_END action',
            fn: actions.signoutEnd(),
            expectedActions: [dispatchAction.SIGNOUT_END_ACTION],
        },
    ];

    syncTests.forEach(testActionFunction);

    const asyncTests = [
        {
            it: 'signin: should return expected actions',
            fn: actions.signin(),
            storeState: initState,
            expectedActions: [],
        },
        {
            it: 'signin: should handle error',
            fn: actions.signin(),
            storeState: errorUserManagerState(),
            expectedActions: [
                dispatchAction.HANDLE_ERROR_AUTH_ACTION(`Failed to redirect to the authorization endpoint: ${USER_MANAGER_ERROR_MSG}`),
                dispatchAction.NETWORK_AUTH_FAILURE_ACTION,
            ],
        },
        {
            it: 'signinCallback: should return expected actions',
            fn: actions.signinCallback(),
            storeState: initState,
            expectedActions: [
                dispatchAction.LOCATION_PUSH_ACTION('/'),
            ],
        },
        {
            it: 'signinCallback: should return push action with expected path "/data"',
            fn: actions.signinCallback(),
            storeState: signinRedirectCallbackState('/data'),
            expectedActions: [
                dispatchAction.LOCATION_PUSH_ACTION('/data'),
            ],
        },
        {
            it: 'signinCallback: should return push action with expected path "/" if state path set to "/login"',
            fn: actions.signinCallback(),
            storeState: signinRedirectCallbackState('/login'),
            expectedActions: [
                dispatchAction.LOCATION_PUSH_ACTION('/'),
            ],
        },
        {
            it: 'signinCallback: should return push action with expected path "/" if state path set to "/login/callback"',
            fn: actions.signinCallback(),
            storeState: signinRedirectCallbackState('/login/callback'),
            expectedActions: [
                dispatchAction.LOCATION_PUSH_ACTION('/'),
            ],
        },
        {
            it: 'signinCallback: should handle error',
            fn: actions.signinCallback(),
            storeState: errorUserManagerState(),
            expectedActions: [
                dispatchAction.HANDLE_ERROR_AUTH_ACTION(`Failed to remove the authenticated user from the session after authencation callback failed: ${USER_MANAGER_ERROR_MSG}`),
                dispatchAction.NETWORK_AUTH_FAILURE_ACTION,
            ],
        },
        {
            it: 'signout: should return expected actions',
            fn: actions.signout(),
            storeState: initState,
            expectedActions: [
                dispatchAction.SIGNOUT_START_ACTION,
                dispatchAction.SIGNOUT_END_ACTION,
            ],
        },
        {
            it: 'signout: should handle error',
            fn: actions.signout(),
            storeState: errorUserManagerState(),
            expectedActions: [
                dispatchAction.SIGNOUT_START_ACTION,
                dispatchAction.HANDLE_ERROR_AUTH_ACTION(`Failed to sign out: ${USER_MANAGER_ERROR_MSG}`),
                dispatchAction.NETWORK_AUTH_FAILURE_ACTION,
                dispatchAction.SIGNOUT_END_ACTION,
            ],
        },
        {
            it: 'signoutCallback: should return expected actions',
            fn: actions.signoutCallback(),
            storeState: initState,
            expectedActions: [],
        },
        {
            it: 'signoutCallback: should handle error',
            fn: actions.signoutCallback(),
            storeState: errorUserManagerState(),
            expectedActions: [
                dispatchAction.HANDLE_ERROR_AUTH_ACTION(`An error occurred during the logout process: ${USER_MANAGER_ERROR_MSG}`),
                dispatchAction.NETWORK_AUTH_FAILURE_ACTION,
            ],
        },
        {
            it: 'loadClients: should handle error if user is not authenticated',
            fn: actions.loadClients(),
            storeState: initState,
            expectedActions: [
                dispatchAction.HANDLE_ERROR_AUTH_ACTION('missing the "instanceIds" claim in ID token'),
                dispatchAction.NETWORK_AUTH_FAILURE_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
