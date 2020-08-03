// @flow
import { ErrorMockManagementClient, account, latestOverlay } from '../../../../js/mock/managementClient';
import { ErrorUserManager, MockUserManager } from '../../../../js/mock/userManager';
import { ApiErrorObject } from '../../../../js/mock/error';
import type { AppState } from '../../../../types/state';
import configureStore from 'redux-mock-store';
import { initialFullState } from '../../../reducers/initialConstants';
import thunk from 'redux-thunk';


type ActionTestObject = {|
    skip?: boolean,
    it: string,
    fn: Function,
    expectedActions: Array<{ type: string }>,
|};

type DispatchTestObject = {|
    skip?: boolean,
    it: string,
    fn: Function,
    storeState: AppState,
    expectedActions: Array<{ type: string }>,
|};

export const mockStore = () => configureStore([thunk]);

export const APP_CONFIG = {
    managementEndpoint: 'https://managementEndpoint',
    oidcAuthority: 'oidcAuthority',
    oidcClientId: 'oidcClientId',
    stsEndpoint: 'https://stsEndpoint',
    s3Endpoint: 'https://s3Endpoint',
};
export const INSTANCE_ID = '3d49e1f9-fa2f-40aa-b2d4-c7a8b04c6cde';

export const initState: AppState = initialFullState;

export const USER_MANAGER_ERROR_MSG = 'User Manager Error Response';
export const MANAGEMENT_ERROR_MSG = 'Management API Error Response';

export const USER_MANAGER_ERROR = new ApiErrorObject(USER_MANAGER_ERROR_MSG, 500);
export const MANAGEMENT_ERROR = new ApiErrorObject(MANAGEMENT_ERROR_MSG, 500);

export const LATEST_OVERLAY = latestOverlay;
export const ACCOUNT = account;

export function errorUserManagerState(): AppState {
    const state = initState;
    return {
        ...state,
        auth: {
            ...state.auth,
            userManager: new ErrorUserManager(USER_MANAGER_ERROR),
        },
    };
}

export function errorManagementState(): AppState {
    const state = initState;
    return {
        ...state,
        auth: {
            ...state.auth,
            managementClient: new ErrorMockManagementClient(MANAGEMENT_ERROR),
        },
    };
}

export function signinRedirectCallbackState(path: string): AppState {
    const state = initState;
    const userManager = new MockUserManager();
    /*eslint-disable flowtype-errors/show-errors*/
    userManager.signinRedirectCallback = () => {
        return Promise.resolve({
            state: {
                path,
            },
        });
    };
    /*eslint-enable */
    return {
        ...state,
        auth: {
            ...state.auth,
            userManager,
        },
    };
}

export function authenticatedUserState(): AppState {
    const state = initState;
    return {
        ...state,
        oidc: {
            ...state.oidc,
            user: {
                id_token: 'idtoken',
                session_state: '8480d2f0-be54-4c1b-9df7-fcce8dfc7436',
                access_token: 'accessToken',
                refresh_token: 'refreshToken',
                token_type: 'bearer',
                scope: 'openid profile email',
                profile: {
                    auth_time: 1592593605,
                    jti: 'd193f7de-134c-47cf-a4e5-7a1b9a7eed72',
                    sub: 'deff329b-72fc-450a-bcb1-354d989859a6',
                    typ: 'ID',
                    azp: 'myclient',
                    session_state: '8480d2f0-be54-4c1b-9df7-fcce8dfc7436',
                    acr: '1',
                    email_verified: true,
                    role: 'user',
                    instanceIds: [
                        INSTANCE_ID,
                    ],
                    name: 'FirstName LastName',
                    preferred_username: 'username',
                    given_name: 'FirstName',
                    family_name: 'LastName',
                    email: 'test@test.com',
                },
                expires_at: 1592593907,
                state: {
                    path: '/',
                },
            },
            isLoadingUser: false,
        },
    };
}


/**
 * Test function for redux action creators
 * @param (object) test - test object
 * @param (boolean) test.skip - skip test
 * @param (string) test.it - test message
 * @param (function) test.fn - test action
 * @param (object[]) test.expectedActions - list of expected dispatch actions
 */
export const testActionFunction = (test: ActionTestObject) => {
    (test.skip ? it.skip : it)(test.it, () => {
        expect(test.fn).toEqual(test.expectedActions[0]);
    });
};

/**
 * Test function for complex dispatch functions
 * @param (object) test - test object
 * @param (boolean) test.skip - skip test
 * @param (object) test.storeState - redux state
 * @param (string) test.it - test message
 * @param (function) test.fn - test action
 * @param (object[]) test.expectedActions - list of expected dispatch actions
 */

export const testDispatchFunction = (test: DispatchTestObject) => {
    (test.skip ? it.skip : it)(test.it, () => {
        const store = mockStore()(test.storeState);
        return store.dispatch(test.fn)
            .then(() => expect(store.getActions()).toEqual(test.expectedActions))
            .catch(error => {
                throw new Error(`Expected success, but got error ${error.message}`);
            });
    });
};
