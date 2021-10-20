import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import { addSecret } from './secrets';
import { batch } from 'react-redux';
import { getClients } from '../utils/actions';
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

export function updateGroupsForUserList(list) {
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

export function openKeyDeleteDialog(accessKey) {
  return {
    type: 'OPEN_KEY_DELETE_DIALOG',
    accessKey,
  };
}

export function closeKeyDeleteDialog() {
  return {
    type: 'CLOSE_KEY_DELETE_DIALOG',
  };
}

export function openSecretDialog(accessKey) {
  return {
    type: 'OPEN_SECRET_DIALOG',
    accessKey,
  };
}

export function closeSecretDialog() {
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
    const { iamClient } = getClients(getState());
    dispatch(networkStart('Saving access key'));
    iamClient
      .createAccessKey(userName)
      .then(resp => {
        dispatch(
          addSecret({
            accessKey: resp.AccessKey.AccessKeyId,
            secretKey: resp.AccessKey.SecretAccessKey,
          }),
        );
        dispatch(listAccessKeys(userName));
      })
      .catch(error => dispatch(handleClientError(error)))
      .catch(error => dispatch(handleApiError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}

export function createUser(userName) {
  return (dispatch, getState) => {
    const { iamClient } = getClients(getState());
    dispatch(networkStart('Saving user'));
    iamClient
      .createUser(userName)
      .then(() => {
        // to have a single render update out of these multiple batches
        batch(() => {
          dispatch(push('/users'));
          dispatch(listUsers());
          dispatch(getUser(userName));
        });
      })
      .catch(error => dispatch(handleClientError(error)))
      .catch(error => dispatch(handleApiError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}

export function deleteAccessKey(accessKey, userName) {
  return (dispatch, getState) => {
    const { iamClient } = getClients(getState());
    dispatch(closeKeyDeleteDialog());
    dispatch(networkStart('Deleting access key'));
    iamClient
      .deleteAccessKey(accessKey, userName)
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
    const { iamClient } = getClients(getState());
    dispatch(hideUser());
    dispatch(closeUserDeleteDialog());
    dispatch(networkStart('Deleting user'));
    iamClient
      .deleteUser(userName)
      .then(() => {
        dispatch(listUsers());
      })
      .catch(error => dispatch(handleClientError(error)))
      .catch(error => dispatch(handleApiError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}

export function listUsers() {
  return (dispatch, getState) => {
    const { iamClient } = getClients(getState());
    dispatch(networkStart('Listing users'));
    iamClient
      .listUsers()
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
    const { iamClient } = getClients(getState());
    dispatch(networkStart('Listing access keys'));
    iamClient
      .listAccessKeys(userName)
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
    const { iamClient } = getClients(getState());
    dispatch(networkStart('Listing attached user policies'));
    iamClient
      .listAttachedUserPolicies(userName)
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
    const { iamClient } = getClients(getState());
    dispatch(networkStart('Listing user groups'));
    iamClient
      .listGroupsForUser(userName)
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
    const { iamClient } = getClients(getState());
    dispatch(networkStart('Retrieving user'));
    iamClient
      .getUser(userName)
      .then(resp => {
        dispatch(displayUser(resp.User));
        dispatch(listAccessKeys(userName));
        dispatch(listAttachedUserPolicies(userName));
      })
      .catch(error => dispatch(handleClientError(error)))
      .catch(error => dispatch(handleApiError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
