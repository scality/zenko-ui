import type {
  AccessKey,
  Account,
  CreateAccountRequest,
  SecretKey,
} from '../../types/account';
import type {
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
import { removeAccountIDStored } from '../utils/localStorage';
import {
  handleAWSClientError,
  handleAWSError,
  handleApiError,
  handleClientError,
} from './error';
import { networkEnd, networkStart } from './network';
import type { IamAccessKey } from '../../types/user';
import { getAssumeRoleWithWebIdentityIAM } from '../../js/IAMClient';
import { getClients } from '../utils/actions';
import { push } from 'connected-react-router';
import { updateConfiguration } from './configuration';
import { listBuckets } from './s3bucket';

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
  accountName: string,
  accessKey: AccessKey,
  secretKey: SecretKey,
): AddAccountSecretAction {
  return {
    type: 'ADD_ACCOUNT_SECRET',
    accountName,
    accessKey,
    secretKey,
  };
}
export function deleteAccountSecret(): DeleteAccountSecretAction {
  return {
    type: 'DELETE_ACCOUNT_SECRET',
  };
}

export function createAccount(
  user: CreateAccountRequest,
): ThunkStatePromisedAction {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    const { managementClient, instanceId } = getClients(getState());
    const params = {
      uuid: instanceId,
      user: { ...user, userName: user.Name },
    };
    dispatch(networkStart('Creating account'));
    return managementClient
      .createConfigurationOverlayUser(params.user, params.uuid)
      .then((resp) => Promise.all([resp.id, dispatch(updateConfiguration())]))
      .then(() => dispatch(push(`/accounts/${user.Name}`)))
      .catch((error) => dispatch(handleClientError(error)))
      .catch((error) => dispatch(handleApiError(error, 'byComponent')))
      .finally(() => dispatch(networkEnd()));
  };
}
export function deleteAccount(accountName: string): ThunkStatePromisedAction {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    const { managementClient, instanceId } = getClients(getState());
    const params = {
      uuid: instanceId,
      accountName,
    };
    dispatch(networkStart('Deleting account'));
    return managementClient
      .deleteConfigurationOverlayUser(
        params.uuid,
        undefined,
        params.accountName,
      )
      .then(() => dispatch(updateConfiguration()))
      .then(() => dispatch(push('/accounts')))
      .then(() => dispatch(closeAccountDeleteDialog()))
      .then(() => {
        removeAccountIDStored();
      })
      .catch((error) => {
        // TODO: fix closeAccountDeleteDialog that might happen twice
        // if selectAccountID() fails
        dispatch(closeAccountDeleteDialog());
        return dispatch(handleClientError(error));
      })
      .catch((error) => dispatch(handleApiError(error, 'byModal')))
      .finally(() => {
        dispatch(networkEnd());
      });
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
        dispatch(listAccountAccessKeySuccess(resp.AccessKeyMetadata)),
      )
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
    return getAssumeRoleWithWebIdentityIAM(getState(), roleArn)
      .then((iamClient) => iamClient.deleteAccessKey(accessKey))
      .then(() => dispatch(listAccountAccessKeys(roleArn)))
      .catch((error) => dispatch(handleAWSClientError(error)))
      .catch((error) => dispatch(handleAWSError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
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
