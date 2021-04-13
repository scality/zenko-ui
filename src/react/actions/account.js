// @flow
import type { Account, CreateAccountRequest } from '../../types/account';
import type {
    CloseAccountDeleteDialogAction,
    OpenAccountDeleteDialogAction,
    SelectAccountAction,
    ThunkStatePromisedAction,
} from '../../types/actions';
import { getAccountIDStored, removeAccountIDStored, setAccountIDStored } from '../utils/localStorage';
import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import { assumeRoleWithWebIdentity } from './sts';
import { getClients } from '../utils/actions';
import { push } from 'connected-react-router';
import { updateConfiguration } from './configuration';

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

export function selectAccount(account: Account): SelectAccountAction {
    return {
        type: 'SELECT_ACCOUNT',
        account,
    };
}

export function selectAccountID(accountID?: string): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { zenkoClient } = getClients(getState());
        const { configuration } = getState();
        const accounts = configuration.latest.users;
        let account = accounts.find(a => a.id === accountID);
        if (!accountID || !account) {
            if (accounts.length === 0) {
                // clean S3 client and buckets' list if no account.
                zenkoClient.logout();
                removeAccountIDStored();
                return Promise.resolve();
            }
            account = accounts[0];
            const accountIDStored = getAccountIDStored();
            if (accountIDStored) {
                const accountStored = accounts.find(a => a.id === accountIDStored);
                if (accountStored) {
                    account = accountStored;
                }
            }
        }
        setAccountIDStored(account.id);
        dispatch(selectAccount(account));
        const roleArn = `arn:aws:iam::${account.id}:role/roleForB`;
        return dispatch(assumeRoleWithWebIdentity(roleArn));
    };
}

export function createAccount(user: CreateAccountRequest): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        const params = { uuid: instanceId, user };
        dispatch(networkStart('Creating account'));
        return managementClient.createConfigurationOverlayUser(params)
            .then(resp => Promise.all([resp.body.id, dispatch(updateConfiguration())]))
            .then(([id]) => dispatch(selectAccountID(id)))
            .then(() => dispatch(push(`/accounts/${user.userName}`)))
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}


export function deleteAccount(accountName: string): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        const params = { uuid: instanceId, accountName };
        dispatch(networkStart('Deleting account'));
        return managementClient.deleteConfigurationOverlayUser(params)
            .then(() => dispatch(updateConfiguration()))
            .then(() => dispatch(push('/accounts')))
            .then(() => dispatch(closeAccountDeleteDialog()))
            .then(() => {
                removeAccountIDStored();
                return dispatch(selectAccountID());
            })
            .catch(error => {
                // TODO: fix closeAccountDeleteDialog that might happen twice
                // if selectAccountID() fails
                dispatch(closeAccountDeleteDialog());
                return dispatch(handleClientError(error));
            })
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => {
                dispatch(networkEnd());
            });
    };
}
