import { handleErrorMessage, loadInstanceLatestStatus, listBuckets, loadInstanceStats, networkAuthFailure} from './index';
import S3Client from '../../js/S3Client';
import STSClient from '../../js/STSClient';
import { loadUser } from 'redux-oidc';
import makeApiClient from '../../js/managementClient';
import  { makeUserManager } from '../../js/UserManager';
import { push } from 'connected-react-router';
import { store } from '../App';

export function initClients(instanceId, managementClient, s3Client) {
    console.log('s3Client!!!', s3Client);
    return {
        type: 'INIT_CLIENTS',
        instanceId,
        managementClient,
        s3Client,
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
        const sts = new STSClient(config, oidc.user.id_token);
        return Promise.all([
            sts.assumeRoleWithWebIdentity(),
            makeApiClient(config, oidc.user.id_token),
        ])
            .then(([creds, managementClient]) => {
                dispatch(initClients(config.instanceId, managementClient, new S3Client(creds.Credentials)));
                return Promise.all([
                    dispatch(listBuckets()),
                    dispatch(loadInstanceLatestStatus()),
                    dispatch(loadInstanceStats()),
                ]);
            })
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
    };
}
