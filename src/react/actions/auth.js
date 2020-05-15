import { handleErrorMessage, loadInstanceLatestStatus, loadInstanceStats, networkAuthFailure} from './';
import makeApiClient from '../../js/apiClient';
import  { makeUserManager } from '../../js/UserManager';
import { push } from 'connected-react-router';

export function login(instanceId, apiClient) {
    return {
        type: 'LOG_IN',
        instanceId,
        apiClient,
    };
}

export function setUserManager(userManager) {
    return {
        type: 'SET_USER_MANAGER',
        userManager,
    };
}

export function userFound(user) {
    return {
        type: 'USER_FOUND',
        user,
    };
}

export function setConfig(config) {
    return {
        type: 'SET_CONFIG',
        config,
    };
}

export function signin() {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        return userManager.signinRedirect();
    };
}

export function signinCallback() {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        userManager.signinRedirectCallback()
            .then(() => {
                dispatch(loadUser()).then(() => dispatch(push('/')));
            })
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
    };
}

export function signout() {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        return userManager.signoutRedirect();
    };
}

function getConfig() {
    return fetch('/config.json', { credentials: 'same-origin' })
        .then(response => response.json())
        // TODO: validate configuration file
        .then((jsonResp) => {
            return {
                instanceId: jsonResp.instanceId,
                apiEndpoint: jsonResp.apiEndpoint,
                oidcAuthority: jsonResp.oidcAuthority,
                oidcClientId: jsonResp.oidcClientId,
            };
        });
}

export function loadConfig() {
    return dispatch => {
        return getConfig()
            .then((config) => {
                dispatch(setConfig(config));
                const userManager = makeUserManager(config);
                dispatch(setUserManager(userManager));
                return userManager;
            })
            .then(userManager => {
                return userManager.getUser();
            })
            .then(user => {
                console.log('user!!!', user);
                dispatch(userFound(user));
            })
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
    };
}

export function loadUser() {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        return userManager.getUser()
            .then(user => {
                console.log('user!!!', user);
                dispatch(userFound(user));
            })
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
    };
}

export function loadAPIs() {
    return (dispatch, getState) => {
        const config = getState().auth.config;
        const user = getState().auth.user;
        return makeApiClient(config.apiEndpoint, config.instanceId, user.token)
            .then((apiClient) => {
                dispatch(login(config.instanceId, apiClient));
                return Promise.all([
                    dispatch(loadInstanceLatestStatus()),
                    dispatch(loadInstanceStats()),
                ]);
            })
            .then(() => {})
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
    };
}
