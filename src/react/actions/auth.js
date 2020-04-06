import { handleApiError, handleClientError, loadInstanceLatestStatus, loadInstanceStats} from './';
import makeApiClient from '../../js/apiClient';

export function login(instanceId, apiClient) {
    return {
        type: 'LOG_IN',
        instanceId,
        apiClient,
    };
}

function getConfig() {
    return fetch('/config.json', { credentials: 'same-origin' })
        .then(response => response.json())
        .then((jsonResp) => {
            return {
                instanceId: jsonResp.instanceId,
                apiEndpoint: jsonResp.apiEndpoint,
                oidcToken: 'oidc',
            };
        });
}

export function loadCredentials() {
    return dispatch => {
        return getConfig()
            .then((resp) => {
                return Promise.all([
                    resp.instanceId,
                    // TODO: use oidc token
                    makeApiClient(resp.apiEndpoint, resp.instanceId),
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
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}
