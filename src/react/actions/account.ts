import { getAssumeRoleWithWebIdentityIAM } from '../../js/IAMClient';
import { AccessKey, Account, SecretKey } from '../../types/account';
import {
  AddAccountSecretAction,
  CloseAccountDeleteDialogAction,
  CloseAccountKeyCreateModalAction,
  DeleteAccountSecretAction,
  DispatchFunction,
  GetStateFunction,
  ListAccountAccessKeySuccessAction,
  OpenAccountDeleteDialogAction,
  OpenAccountKeyCreateModalAction,
  SelectAccountAction,
  ThunkStatePromisedAction,
} from '../../types/actions';
import { IamAccessKey } from '../../types/user';
import { getClients } from '../utils/actions';
import {
  handleAWSClientError,
  handleAWSError,
  handleApiError,
  handleClientError,
} from './error';
import { networkEnd, networkStart } from './network';

export function openAccountDeleteDialog(): OpenAccountDeleteDialogAction {
  return {
    type: 'OPEN_ACCOUNT_DELETE_DIALOG',
  };
}
export function closeAccountDeleteDialog(): CloseAccountDeleteDialogAction {
  return {
    type: 'CLOSE_ACCOUNT_DELETE_DIALOG',
  };
}
export function openAccountKeyCreateModal(): OpenAccountKeyCreateModalAction {
  return {
    type: 'OPEN_ACCOUNT_KEY_CREATE_MODAL',
  };
}
export function closeAccountKeyCreateModal(): CloseAccountKeyCreateModalAction {
  return {
    type: 'CLOSE_ACCOUNT_KEY_CREATE_MODAL',
  };
}
export function selectAccount(account: Account): SelectAccountAction {
  return {
    type: 'SELECT_ACCOUNT',
    account,
  };
}
export function listAccountAccessKeySuccess(
  accessKeys: Array<IamAccessKey>,
): ListAccountAccessKeySuccessAction {
  return {
    type: 'LIST_ACCOUNT_ACCESS_KEY_SUCCESS',
    accessKeys,
  };
}
export function addAccountSecret(
  userName: string,
  accessKey: AccessKey,
  secretKey: SecretKey,
): AddAccountSecretAction {
  return {
    type: 'ADD_ACCOUNT_SECRET',
    userName,
    accessKey,
    secretKey,
  };
}
export function deleteAccountSecret(): DeleteAccountSecretAction {
  return {
    type: 'DELETE_ACCOUNT_SECRET',
  };
}

export function listAccountAccessKeys(
  roleArn: string,
): ThunkStatePromisedAction {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    dispatch(networkStart('Listing Root user Access keys'));
    return getAssumeRoleWithWebIdentityIAM(getState(), roleArn)
      .then((iamClient) => iamClient.listOwnAccessKeys())
      .then((resp) =>
        //@ts-expect-error fix this when you are working on it
        dispatch(listAccountAccessKeySuccess(resp.AccessKeyMetadata)),
      )
      .catch((error) => {
        if (error.statusCode === 404) {
          return dispatch(listAccountAccessKeySuccess([]));
        }
        throw error;
      })
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
export function deleteAccountAccessKey(
  roleArn: string,
  accessKey: string,
): ThunkStatePromisedAction {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    dispatch(networkStart('Deleting Root user Access keys'));
    return (
      getAssumeRoleWithWebIdentityIAM(getState(), roleArn)
        //@ts-expect-error fix this when you are working on it
        .then((iamClient) => iamClient.deleteAccessKey(accessKey))
        .then(() => dispatch(listAccountAccessKeys(roleArn)))
        .catch((error) => dispatch(handleAWSClientError(error)))
        .catch((error) => dispatch(handleAWSError(error, 'byModal')))
        .finally(() => dispatch(networkEnd()))
    );
  };
}
export function createAccountAccessKey(
  accountName: string,
  roleArn: string,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { managementClient, instanceId } = getClients(getState());
    const params = {
      uuid: instanceId,
      accountName,
    };
    dispatch(networkStart('Creating Root user Access keys'));
    return managementClient
      .generateKeyConfigurationOverlayUser(params.uuid, params.accountName)
      .then((resp) => {
        dispatch(
          addAccountSecret(resp.userName, resp.accessKey, resp.secretKey),
        );
        return dispatch(listAccountAccessKeys(roleArn));
      })
      .catch((error) => dispatch(handleClientError(error)))
      .catch((error) => dispatch(handleApiError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
