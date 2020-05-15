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

export function signinCallback() {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        userManager.signinRedirectCallback()
            .then(() => {
                dispatch(loadUser()).then(() => dispatch(push('/')));
            })
            // TODO: handle errors
            .catch((error) => {console.log('error!!!', error);});
    };
}

export function signin() {
    return (dispatch, getState) => {
        const userManager = getState().auth.userManager;
        return userManager.signinRedirect();
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

// function getAuth() {
//     return (dispatch, getState)  => {
//         // TODO: check conf var exists
//         const userManager = getState().auth.userManager;
//         // TODO: handle errors
//         return userManager.getUser()
//             .then(u => {
//                 console.log('u!!!', u);
//                 if (!u || u.expired) {
//                     throw {message: 'user expired'};
//                 }
//                 const user = { name: u.profile.name, email: u.profile.email, expired: u.expired };
//                 const token = u['id_token'];
//                 return { user, token };
//             })
//             .catch(() => {
//                 return dispatch(push('/login'));
//             });
//     };

// return fetch('/auth/refresh', { credentials: 'same-origin' })
//     .then(response => response.json())
//     .then((jsonResp: AuthResponse) => {
//         const {
//             user,
//             token,
//             status,
//             unauthenticated,
//             unauthorized,
//         } = jsonResp;
//         if (!user || !token || status === 401 || status === 403 ||
//             unauthenticated || unauthorized ) {
//             throw {status, unauthenticated, unauthorized};
//         }
//         if (window.Raven) {
//             window.Raven.setUserContext({
//                 email: user.email,
//                 id: user.userId,
//             });
//         }
//         return { user, token };
//     })
//     .catch(() => {
//         // TODO: move redirects to actions
//         window.location.assign('/auth/google');
//         return {};
//     });
// }

export function loadConfig() {
    return dispatch => {
        return getConfig()
            .then((config) => {
                dispatch(setConfig(config));
                const userManager = makeUserManager(config);
                console.log('userManager!!!', userManager);
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

export function loadCredentials() {
    return (dispatch, getState) => {
        const config = getState().auth.config;
        const user = getState().auth.user;
        console.log('loadCredentials => config!!!', config);
        console.log('loadCredentials => user!!!', user);
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
