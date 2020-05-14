import { handleErrorMessage, loadInstanceLatestStatus, loadInstanceStats, networkAuthFailure} from './';
import makeApiClient from '../../js/apiClient';
import  { makeUserManager } from '../../js/UserManager';

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

function getAuth() {
    return (dispatch, getState)  => {
        // TODO: check conf var exists
        const userManager = getState().auth.userManager;
        // TODO: handle errors
        return userManager.getUser().then(u => {
            console.log('u!!!', u);
            const user = { name: u.profile.name, email: u.profile.email, expired: u.expired };
            const token = u['id_token'];
            return { user, token };
        });
    };

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
}

export function loadCredentials() {
    return dispatch => {
        return getConfig()
            .then((config) => {
                const { oidcAuthority: authority, oidcClientId: clientId } = config;
                const userManager = makeUserManager({ authority, clientId });
                dispatch(setUserManager(userManager));
                return dispatch(getAuth(config)).then(auth => {
                    return { user: auth.user, token: auth.token, config };
                });
            })
            .then((r) => {
                return Promise.all([
                    r.config.instanceId,
                    // TODO: use oidc token
                    makeApiClient(r.config.apiEndpoint, r.config.instanceId, r.token),
                ]);
            })
            .then(([instanceId, apiClient]) => {
                dispatch(login(instanceId, apiClient));
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
