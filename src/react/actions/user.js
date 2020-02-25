import { handleApiError, handleClientError } from './error';

export function updateUsersList(list) {
    return {
        type: 'UPDATE_USER_LIST',
        list: list,
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

export function getUser(userName) {
    return (dispatch, getState) => {
        const client = getState().iamClient.client;
        client.getUser(userName)
            .then(resp => {
                return dispatch(showUser(resp.User));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}
