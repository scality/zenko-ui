import { Account } from '../../types/account';
import { SelectAccountAction, ThunkStatePromisedAction } from '../../types/actions';
import { AuthUser } from '../../types/auth';
import { getClients } from '../utils/actions';
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
  onSuccess: (key: { userName: string; accessKey: string; secretKey: string }) => void,
  onError?: (message: string) => void,
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
      .catch((error) => {
        if (onError) {
          onError(error.message || 'Failed to create access key');
        }
      })
      .finally(() => dispatch(networkEnd()));
  };
}
