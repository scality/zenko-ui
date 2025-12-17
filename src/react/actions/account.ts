import { getAssumeRoleWithWebIdentityIAM } from '../../js/IAMClient';
import { Account, AccountKey } from '../../types/account';
import {
  DispatchFunction,
  GetStateFunction,
  ListAccountAccessKeySuccessAction,
  SelectAccountAction,
  ThunkStatePromisedAction,
} from '../../types/actions';
import { AuthUser } from '../../types/auth';
import { IamAccessKey } from '../../types/user';
import { getClients } from '../utils/actions';
import {
  handleAWSClientError,
  handleAWSError,
  handleApiError,
  handleClientError,
} from './error';
import { networkEnd, networkStart } from './network';

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
export function listAccountAccessKeys(
  roleArn: string,
  user: AuthUser,
): ThunkStatePromisedAction {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    dispatch(networkStart('Listing Root user Access keys'));
    return getAssumeRoleWithWebIdentityIAM(getState(), roleArn, user)
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
  user: AuthUser,
): ThunkStatePromisedAction {
  return (dispatch: DispatchFunction, getState: GetStateFunction) => {
    dispatch(networkStart('Deleting Root user Access keys'));
    return (
      getAssumeRoleWithWebIdentityIAM(getState(), roleArn, user)
        //@ts-expect-error fix this when you are working on it
        .then((iamClient) => iamClient.deleteAccessKey(accessKey))
        .then(() => dispatch(listAccountAccessKeys(roleArn, user)))
        .catch((error) => dispatch(handleAWSClientError(error)))
        .catch((error) => dispatch(handleAWSError(error, 'byModal')))
        .finally(() => dispatch(networkEnd()))
    );
  };
}
export function createAccountAccessKey(
  accountName: string,
  roleArn: string,
  user: AuthUser,
  onSuccess: (key: AccountKey) => void,
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
        onSuccess({
          userName: resp.userName,
          accessKey: resp.accessKey,
          secretKey: resp.secretKey,
        });
      })
      .catch((error) => dispatch(handleClientError(error)))
      .catch((error) => dispatch(handleApiError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
