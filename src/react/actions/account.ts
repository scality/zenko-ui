import { Account, AccountKey } from '../../types/account';
import {
  DispatchFunction,
  GetStateFunction,
  SelectAccountAction,
  ThunkStatePromisedAction,
} from '../../types/actions';
import { AuthUser } from '../../types/auth';
import { getClients } from '../utils/actions';
import {
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
