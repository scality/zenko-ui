import { handleApiError, handleClientError } from './error';

export function updateUsersList(list) {
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

export function createUser(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        client.createUser(userName)
            .then(() => {
                return dispatch(listUsers());
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
                console.log('resp!!!', resp);
                dispatch(updateUsersList(resp.Users));
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
