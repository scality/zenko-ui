// @flow

import type { AppConfig, InstanceId } from '../../types/entities';

import type {
    ConfigAuthFailureAction,
    LoadClientsSuccessAction,
    LoadConfigSuccessAction,
    SetAppConfigAction,
    SetManagementClientAction,
    SetSTSClientAction,
    SetUserManagerAction,
    SignoutEndAction,
    SignoutStartAction,
    ThunkNonStateAction,
    ThunkStatePromisedAction,
} from '../../types/actions';
import { assumeRoleWithWebIdentity, handleErrorMessage, loadInstanceLatestStatus, loadInstanceStats, networkAuthFailure, setZenkoClient, updateConfiguration } from './index';
import type { ManagementClient as ManagementClientInterface } from '../../types/managementClient';

import STSClient from '../../js/STSClient';
import type { STSClient as STSClientInterface } from '../../types/sts';

import type { UserManager as UserManagerInterface } from '../../types/auth';
import ZenkoClient from '../../js/ZenkoClient';

import { getAppConfig } from '../../js/config';
import { loadUser } from 'redux-oidc';
import makeMgtClient from '../../js/managementClient';
import { makeUserManager } from '../../js/userManager';
import { push } from 'connected-react-router';
import { store } from '../store';

export function setManagementClient(managementClient: ManagementClientInterface): SetManagementClientAction {
    return {
        type: 'SET_MANAGEMENT_CLIENT',
        managementClient,
    };
}

export function setSTSClient(stsClient: STSClientInterface): SetSTSClientAction {
    return {
        type: 'SET_STS_CLIENT',
        stsClient,
    };
}

export function setUserManager(userManager: UserManagerInterface): SetUserManagerAction {
    return {
        type: 'SET_USER_MANAGER',
        userManager,
    };
}

export function setAppConfig(config: AppConfig): SetAppConfigAction {
    return {
        type: 'SET_APP_CONFIG',
        config,
    };
}

export function selectInstance(selectedId: InstanceId) {
    return {
        type: 'SELECT_INSTANCE',
        selectedId,
    };
}

export function loadConfigSuccess(): LoadConfigSuccessAction {
    return {
        type: 'LOAD_CONFIG_SUCCESS',
    };
}

export function loadClientsSuccess(): LoadClientsSuccessAction {
    return {
        type: 'LOAD_CLIENTS_SUCCESS',
    };
}

export function configAuthFailure(): ConfigAuthFailureAction {
    return {
        type: 'CONFIG_AUTH_FAILURE',
    };
}

export function signoutStart(): SignoutStartAction {
    return {
        type: 'SIGNOUT_START',
    };
}

export function signoutEnd(): SignoutEndAction {
    return {
        type: 'SIGNOUT_END',
    };
}

export function signin(pathname: string): ThunkStatePromisedAction {
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

export function signinCallback(): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        return userManager.signinRedirectCallback()
            .then(user => {
                console.log('signinRedirectCallback: user!!!', user);
                const path = user.state &&
                user.state.path &&
                user.state.path !== '/login' &&
                user.state.path !== '/login/callback' ? user.state.path : '/';
                console.log('signinRedirectCallback: path!!!', path);
                dispatch(push(path));
            })
            .catch(error => {
                // NOTE: removeUser() method is needed to trigger a new "log in" proccess
                // issue under investigation here: https://github.com/IdentityModel/oidc-client-js/issues/965
                return userManager.removeUser()
                    .then(() => {
                        const message = `Failed to process response from the authorization endpoint: ${error.message || '(unknown reason)'}`;
                        dispatch(handleErrorMessage(message, 'byAuth'));
                        dispatch(networkAuthFailure());
                    })
                    .catch(error => {
                        const message = `Failed to remove the authenticated user from the session after authencation callback failed: ${error.message || '(unknown reason)'}`;
                        dispatch(handleErrorMessage(message, 'byAuth'));
                        dispatch(networkAuthFailure());
                    });
            });
    };
}

export function signout(): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        dispatch(signoutStart());
        const userManager = getState().auth.userManager;
        return userManager.signoutPopup()
            .catch(error => {
                const message = `Failed to sign out: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byAuth'));
                dispatch(networkAuthFailure());
            })
            .finally(() => dispatch(signoutEnd()));
    };
}

export function signoutCallback(): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        return userManager.signoutPopupCallback()
            .catch(error => {
                const message = `An error occurred during the logout process: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byAuth'));
                dispatch(networkAuthFailure());
            });
    };
}

export function loadAppConfig(): ThunkNonStateAction {
    return dispatch => {
        return getAppConfig()
            .then(config => {
                dispatch(setAppConfig(config));
                dispatch(setSTSClient(new STSClient({ endpoint: config.stsEndpoint })));
                dispatch(setZenkoClient(new ZenkoClient(config.zenkoEndpoint)));
                dispatch(loadConfigSuccess());
            })
            .catch(error => {
                const message = `Invalid application configuration: ${error.message || '(unknown reason)'}`;
                dispatch(handleErrorMessage(message, 'byComponent'));
                dispatch(configAuthFailure());
            });
    };
}

// loadClients is called when the ID token gets renewed prior to its expiration.
export function loadClients(): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { oidc, auth: { config } } = getState();

        const instanceIds = oidc.user && oidc.user.profile && oidc.user.profile.instanceIds;
        if (!instanceIds || instanceIds.length === 0) {
            dispatch(handleErrorMessage('missing the "instanceIds" claim in ID token', 'byAuth'));
            dispatch(networkAuthFailure());
            return Promise.resolve();
        }
        // TODO: Give the user the ability to select an instance.
        dispatch(selectInstance(instanceIds[0]));

        return makeMgtClient(config.managementEndpoint, oidc.user.id_token)
            .then(managementClient => {
                dispatch(setManagementClient(managementClient));
                return Promise.all([
                    dispatch(updateConfiguration()),
                    dispatch(loadInstanceLatestStatus()),
                    dispatch(loadInstanceStats()),
                ]);
            })
            .then(() => dispatch(assumeRoleWithWebIdentity()))
            .then(() => dispatch(loadClientsSuccess()))
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
    };
}
