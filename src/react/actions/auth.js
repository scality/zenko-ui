import { handleErrorMessage, loadInstanceLatestStatus, listBuckets, loadInstanceStats, networkAuthFailure} from './index';
import S3Client from '../../js/S3Client';
import STSClient from '../../js/STSClient';
import { getAppConfig } from '../../js/config';
import { loadUser } from 'redux-oidc';
import makeMgtClient from '../../js/managementClient';
import  { makeUserManager } from '../../js/userManager';
import { push } from 'connected-react-router';
import { store } from '../store';

export function initClients(managementClient, s3Client) {
    return {
        type: 'INIT_CLIENTS',
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

export function setAppConfig(config) {
    return {
        type: 'SET_APP_CONFIG',
        config,
    };
}

export function loadUserSuccess() {
    return {
        type: 'LOAD_USER_SUCCESS',
    };
}

export function selectInstance(selectedId) {
    return {
        type: 'SELECT_INSTANCE',
        selectedId,
    };
}

export function configAuthFailure() {
    return {
        type: 'CONFIG_AUTH_FAILURE',
    };
}

export function signin(pathname) {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        return userManager.signinRedirect({ state: { path: pathname } })
            .catch(error => {
                const message = `Failed to redirect to the authorization endpoint: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byAuth'));
                dispatch(networkAuthFailure());
            });
    };
}

export function signout() {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        return userManager.removeUser()
            .then(() => userManager.signoutRedirect())
            .catch(error => {
                const message = `Failed to sign out: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byAuth'));
                dispatch(networkAuthFailure());
            });
    };
}

export function signoutCallback() {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        userManager.signoutRedirectCallback()
            .then(() => dispatch(push('/')))
            .catch(error => {
                const message = `An error occurred during the logout process: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byAuth'));
                dispatch(networkAuthFailure());
            });
    };
}

export function loadAppConfig() {
    return dispatch => {
        return getAppConfig()
            .then(config => {
                dispatch(setAppConfig(config));
                const userManager = makeUserManager(config);
                dispatch(setUserManager(userManager));
                return loadUser(store, userManager);
            })
            .then(() => {
                dispatch(loadUserSuccess());
            })
            .catch(error => {
                const message = `Invalid application configuration: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byComponent'));
                dispatch(configAuthFailure());
            });
    };
}

// loadClients is called when the ID token gets renewed prior to its expiration.
export function loadClients() {
    return (dispatch, getState) => {
        const { oidc, auth: { config } } = getState();

        const instanceIds = oidc.user.profile.instanceIds;
        if (!instanceIds || instanceIds.length === 0) {
            dispatch(handleErrorMessage('missing the "instanceIds" claim in ID token', 'byAuth'));
            dispatch(networkAuthFailure());
            return Promise.resolve();
        }
        // TODO: Give the user the ability to select an instance.
        dispatch(selectInstance(instanceIds[0]));

        // TODO: uncomment once STS.assumeRoleWithWebIdentity is implemented in Vault.
        // const sts = new STSClient(config);
        // const assumeRoleParams = {
        //     idToken: oidc.user.id_token,
        //     // roleArn will not be hardcoded but discovered from user's role.
        //     roleArn: 'arn:aws:iam::236423648091:role/zenko-ui-role',
        // }
        return Promise.all([
            // sts.assumeRoleWithWebIdentity(assumeRoleParams),
            {Credentials: {}},
            makeMgtClient(config.managementEndpoint, oidc.user.id_token),
        ])
            .then(([creds, managementClient]) => {
                const s3Params = {
                    accessKey: creds.Credentials.AccessKeyId,
                    secretKey: creds.Credentials.SecretAccessKey,
                    sessionToken: creds.Credentials.SessionToken,
                    endpoint: config.s3Endpoint,
                };
                dispatch(initClients(managementClient, new S3Client(s3Params)));
                return Promise.all([
                    // dispatch(listBuckets()),
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
