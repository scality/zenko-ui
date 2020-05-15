import { handleErrorMessage, loadInstanceLatestStatus, loadInstanceStats, networkAuthFailure} from './index';
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

export function sessionTerminated() {
    return {
        type: 'SESSION_TERMINATED',
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
            // .then(() => dispatch(loadUser()))
            .then(() => dispatch(push('/')))
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
            .then(() => userManager.removeUser())
            .then(() => dispatch(sessionTerminated()))
            .then(() => dispatch(push('/')))
            .catch(error => {
                if (error.message) {
                    dispatch(handleErrorMessage(error.message, 'byAuth'));
                }
                dispatch(networkAuthFailure());
            });
    };
}

export function signinSilentCallback() {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        alert('signinSilentCallback!!!');
        userManager.signinSilentCallback()
            // .then(() => {
            //     dispatch(loadUser()).then(() => dispatch(push('/')));
            // })
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

// export function loadUser() {
//     return (dispatch, getState) => {
//         const userManager = getState().auth.userManager;
//         return userManager.getUser()
//             .then(user => {
//                 console.log("loadUser!!!", user);
//                 dispatch(userFound(user));
//             })
//             .catch(error => {
//                 if (error.message) {
//                     dispatch(handleErrorMessage(error.message, 'byAuth'));
//                 }
//                 dispatch(networkAuthFailure());
//             });
//     };
// }

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
                console.log('INSIDE loadConfig!!!');
                // userManager.signinSilent();
                userManager.events.addSilentRenewError(error => {
                    console.log('addSilentRenewError => error!!!', error);
                });
                userManager.events.addUserLoaded(user => {
                    console.log('addUserLoaded => user!!!', user);
                    dispatch(userFound(user));
                });
                userManager.events.addUserSignedOut(() => {
                    // dispatch(signoutCallback());
                    alert('addUserSignedOut!!');
                });
                userManager.events.addAccessTokenExpired(() => {
                    // dispatch(signoutCallback());
                    alert('accessTokenExpired!!');
                });
                userManager.events.addUserUnloaded(() => {
                    // dispatch(signoutCallback());
                    alert('addUserUnloaded!!');
                });
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
