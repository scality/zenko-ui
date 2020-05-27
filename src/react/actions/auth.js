import { handleErrorMessage, loadInstanceLatestStatus, loadInstanceStats, networkAuthFailure} from './';
import { loadUser } from 'redux-oidc';
import makeApiClient from '../../js/apiClient';
import  { makeUserManager } from '../../js/UserManager';
import { push } from 'connected-react-router';
import { store } from '../App';

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

export function setConfig(config) {
    return {
        type: 'SET_CONFIG',
        config,
    };
}

export function loadUserSuccess() {
    return {
        type: 'LOAD_USER_SUCCESS',
    };
}

export function signin() {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        return userManager.signinRedirect()
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
    };
}

export function signoutCallback() {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        userManager.signoutRedirectCallback()
            // .then(() => userManager.removeUser())
            .then(() => dispatch(push('/')))
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
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
                oidcToken: 'oidc',
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
                // How to access store cleanly - import it? :(
                console.log('userManager!!!', userManager);
                return loadUser(store, userManager);
                // return userManager.getUser();
            })
            .then(() => {
                dispatch(loadUserSuccess());
            })
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
    };
}

export function loadCredentials() {
    return (dispatch, getState) => {
        const { config } = getState().auth;
        const oidc = getState().oidc;
        console.log('config!!!', config);
        console.log('oidc!!!', oidc);
        return makeApiClient(config.apiEndpoint, config.instanceId, oidc.user.id_token)
            .then(apiClient => {
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
