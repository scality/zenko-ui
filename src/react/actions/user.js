import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import { addSecret } from './secrets';
import { push } from 'connected-react-router';

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

export function displayUser(user) {
    return {
        type: 'DISPLAY_USER',
        user: user,
    };
}

export function openUserDeleteDialog() {
    return {
        type: 'OPEN_USER_DELETE_DIALOG',
    };
}

export function closeUserDeleteDialog() {
    return {
        type: 'CLOSE_USER_DELETE_DIALOG',
    };
}

export function openSecretDialog(keyName){
    return {
        type: 'OPEN_SECRET_DIALOG',
        keyName,
    };
}

export function closeSecretDialog(){
    return {
        type: 'CLOSE_SECRET_DIALOG',
    };
}

export function hideUser() {
    return dispatch => {
        dispatch(displayUser({}));
        dispatch(updateAccessKeysList([]));
        dispatch(updateAttachedUserPoliciesList([]));
        dispatch(updateGroupsForUserList([]));
    };
}

export function createAccessKey(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        dispatch(networkStart('Saving access key'));
        client.createAccessKey(userName)
            .then(resp => {
                dispatch(addSecret({
                    accessKey: resp.AccessKey.AccessKeyId,
                    secretKey: resp.AccessKey.SecretAccessKey,
                }));
                dispatch(listAccessKeys(userName));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function createUser(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        dispatch(networkStart('Saving user'));
        client.createUser(userName)
            .then(() => {
                // dispatch(listUsers());
                dispatch(push('/users'));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function deleteAccessKey(accessKey, userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        dispatch(networkStart('Deleting access key'));
        client.deleteAccessKey(accessKey, userName)
            .then(() => {
                dispatch(listAccessKeys(userName));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function deleteUser(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        dispatch(networkStart('Deleting user'));
        client.deleteUser(userName)
            .then(() => {
                dispatch(listUsers());
                dispatch(hideUser());
                dispatch(closeUserDeleteDialog());
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function listUsers() {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        dispatch(networkStart('Listing users'));
        client.listUsers()
            .then(resp => {
                dispatch(updateUserList(resp.Users));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function listAccessKeys(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        dispatch(networkStart('Listing access keys'));
        client.listAccessKeys(userName)
            .then(resp => {
                dispatch(updateAccessKeysList(resp.AccessKeyMetadata));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function listAttachedUserPolicies(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        dispatch(networkStart('Listing attached user policies'));
        client.listAttachedUserPolicies(userName)
            .then(resp => {
                dispatch(updateAttachedUserPoliciesList(resp.AttachedPolicies));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function listGroupsForUser(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        dispatch(networkStart('Listing user groups'));
        client.listGroupsForUser(userName)
            .then(resp => {
                dispatch(updateGroupsForUserList(resp.Groups));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function getUser(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        dispatch(networkStart('Retrieving user'));
        client.getUser(userName)
            .then(resp => {
                dispatch(displayUser(resp.User));
                return resp.User;
            })
            .then(user => {
                dispatch(listAccessKeys(user.UserName));
                dispatch(listAttachedUserPolicies(user.UserName));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}
