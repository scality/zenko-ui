// @flow

import type { AppConfig, InstanceId } from '../../types/entities';

import type {
    ConfigAuthFailureAction,
    LoadUserSuccessAction,
    SetAppConfigAction,
    SetManagementClientAction,
    SetS3ClientAction,
    SetUserManagerAction,
    SignoutEndAction,
    SignoutStartAction,
    ThunkNonStateAction,
    ThunkStatePromisedAction,
} from '../../types/actions';
import { assumeRoleWithWebIdentity, handleErrorMessage, loadInstanceLatestStatus, loadInstanceStats, networkAuthFailure, updateConfiguration } from './index';
import type { ManagementClient as ManagementClientInterface } from '../../types/managementClient';

import type { S3Client as S3ClientInterface } from '../../types/s3';

import type { UserManager as UserManagerInterface } from '../../types/auth';

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

export function setS3Client(s3Client: S3ClientInterface): SetS3ClientAction {
    return {
        type: 'SET_S3_CLIENT',
        s3Client,
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

export function loadUserSuccess(): LoadUserSuccessAction {
    return {
        type: 'LOAD_USER_SUCCESS',
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
                const path = user.state &&
                user.state.path &&
                user.state.path !== '/login' &&
                user.state.path !== '/login/callback' ? user.state.path : '/';
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
                    // dispatch(listBuckets()),
                    dispatch(updateConfiguration()),
                    dispatch(loadInstanceLatestStatus()),
                    dispatch(loadInstanceStats()),
                ]);
            })
            .then(() => {
                return dispatch(assumeRoleWithWebIdentity());
            })
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
    };
}
