import { handleApiError, handleClientError } from './error';
import { addSecret } from './secrets';

export function updateUserList(list) {
    return {
        type: 'UPDATE_USER_LIST',
        list,
    };
}

export function updateAccessKeysList(list) {
    return {
        type: 'UPDATE_ACCESS_KEY_LIST',
        list,
    };
}

export function updateAttachedUserPoliciesList(list) {
    return {
        type: 'UPDATE_ATTACHED_USER_POLICIES_LIST',
        list,
    };
}

export function updateGroupsForUserList(list){
    return {
        type: 'UPDATE_GROUPS_FOR_USER_LIST',
        list,
    };
}

export function showUser(user) {
    return {
        type: 'SHOW_USER',
        user: user,
    };
}

export function createAccessKey(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        client.createAccessKey(userName)
            .then(resp => {
                dispatch(addSecret({
                    accessKey: resp.AccessKey.AccessKeyId,
                    secretKey: resp.AccessKey.SecretAccessKey,
                }));
                dispatch(listAccessKeys(userName));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}

export function createUser(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        client.createUser(userName)
            .then(() => {
                dispatch(listUsers());
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}

export function deleteAccessKey(accessKey, userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        client.deleteAccessKey(accessKey, userName)
            .then(() => {
                dispatch(listAccessKeys(userName));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}

export function listUsers() {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        client.listUsers()
            .then(resp => {
                dispatch(updateUserList(resp.Users));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}

export function listAccessKeys(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        client.listAccessKeys(userName)
            .then(resp => {
                dispatch(updateAccessKeysList(resp.AccessKeyMetadata));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}

export function listAttachedUserPolicies(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        client.listAttachedUserPolicies(userName)
            .then(resp => {
                dispatch(updateAttachedUserPoliciesList(resp.AttachedPolicies));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}

export function listGroupsForUser(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        client.listGroupsForUser(userName)
            .then(resp => {
                dispatch(updateGroupsForUserList(resp.Groups));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}

export function getUser(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        client.getUser(userName)
            .then(resp => {
                dispatch(showUser(resp.User));
                return resp.User;
            })
            .then(user => {
                dispatch(listAccessKeys(user.UserName));
                dispatch(listAttachedUserPolicies(user.UserName));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}
