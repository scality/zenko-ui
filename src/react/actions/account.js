// @flow
import type { AccessKey, Account, CreateAccountRequest, SecretKey } from '../../types/account';
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
import { getAccountIDStored, removeAccountIDStored, setAccountIDStored } from '../utils/localStorage';
import { handleAWSClientError, handleAWSError, handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import type { IamAccessKey } from '../../types/user';
import { assumeRoleWithWebIdentity } from './sts';
import { getAssumeRoleWithWebIdentityIAM } from '../../js/IAMClient';
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

export function listAccountAccessKeySuccess(accessKeys: Array<IamAccessKey>): ListAccountAccessKeySuccessAction {
    return {
        type: 'LIST_ACCOUNT_ACCESS_KEY_SUCCESS',
        accessKeys,
    };
}

export function addAccountSecret(accountName: string, accessKey: AccessKey, secretKey: SecretKey): AddAccountSecretAction {
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

export function selectAccountID(accountID?: string): ThunkStatePromisedAction {
    return (dispatch: DispatchFunction, getState: GetStateFunction) => {
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
    return (dispatch: DispatchFunction, getState: GetStateFunction) => {
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
    return (dispatch: DispatchFunction, getState: GetStateFunction) => {
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

export function listAccountAccessKeys(accountName: string): ThunkStatePromisedAction {
    return (dispatch: DispatchFunction, getState: GetStateFunction) => {
        dispatch(networkStart('Listing Root user Access keys'));
        return getAssumeRoleWithWebIdentityIAM(getState(), accountName)
            .then(iamClient => iamClient.listOwnAccessKeys())
            .then(resp => dispatch(listAccountAccessKeySuccess(resp.AccessKeyMetadata)))
            .catch(error => dispatch(handleAWSClientError(error)))
            .catch(error => dispatch(handleAWSError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function deleteAccountAccessKey(accountName: string, accessKey: string): ThunkStatePromisedAction {
    return (dispatch: DispatchFunction, getState: GetStateFunction) => {
        dispatch(networkStart('Deleting Root user Access keys'));
        return getAssumeRoleWithWebIdentityIAM(getState(), accountName)
            .then(iamClient => iamClient.deleteAccessKey(accessKey))
            .then(() => dispatch(listAccountAccessKeys(accountName)))
            .catch(error => dispatch(handleAWSClientError(error)))
            .catch(error => dispatch(handleAWSError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function createAccountAccessKey(accountName: string): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        const params = { uuid: instanceId, accountName };
        dispatch(networkStart('Creating Root user Access keys'));
        return managementClient.generateKeyConfigurationOverlayUser(params)
            .then(resp => {
                dispatch(addAccountSecret(resp.body.userName, resp.body.accessKey, resp.body.secretKey));
                return dispatch(listAccountAccessKeys(accountName));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}
