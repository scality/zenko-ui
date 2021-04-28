// @flow
import type { Account, CreateAccountRequest } from '../../types/account';
import type {
    CloseAccountDeleteDialogAction,
    DispatchFunction,
    GetStateFunction,
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
import { updateAccessKeysList } from './user';
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
    return (dispatch: DispatchFunction, getState: GetStateFunction) => {
        const { zenkoClient, iamClient } = getClients(getState());
        const { configuration } = getState();
        const accounts = configuration.latest.users;
        let account = accounts.find(a => a.id === accountID);
        if (!accountID || !account) {
            if (accounts.length === 0) {
                // clean S3 client and buckets' list if no account.
                zenkoClient.logout();
                iamClient.logout();
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

export function listAccountAccessKeys(accountID: string): ThunkStatePromisedAction {
    return (dispatch: DispatchFunction, getState: GetStateFunction) => {
        const state = getState();
        const { oidc } = state;
        const { stsClient, iamClient } = getClients(state);

        const assumeRoleParams = {
            idToken: oidc.user.id_token,
            RoleSessionName:'app1',
            roleArn: `arn:aws:iam::${accountID}:role/roleForB`,
        };
        dispatch(networkStart('Listing account access keys'));
        return stsClient.assumeRoleWithWebIdentity(assumeRoleParams)
            .then(creds => {
                const params = {
                    accessKey: creds.Credentials.AccessKeyId,
                    secretKey: creds.Credentials.SecretAccessKey,
                    sessionToken: creds.Credentials.SessionToken,
                };
                iamClient.login(params);
                return iamClient.listOwnAccessKeys();
            })
            .then(resp => dispatch(updateAccessKeysList(resp.AccessKeyMetadata)))
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function deleteAccountAccessKey(accessKey: string, accountID: string): ThunkStatePromisedAction {
    return (dispatch: DispatchFunction, getState: GetStateFunction) => {
        const state = getState();
        const { oidc } = state;
        const { stsClient, iamClient } = getClients(state);

        const assumeRoleParams = {
            idToken: oidc.user.id_token,
            RoleSessionName:'app1',
            roleArn: `arn:aws:iam::${accountID}:role/roleForB`,
        };
        dispatch(networkStart('Deleting account access key'));
        return stsClient.assumeRoleWithWebIdentity(assumeRoleParams)
            .then(creds => {
                const params = {
                    accessKey: creds.Credentials.AccessKeyId,
                    secretKey: creds.Credentials.SecretAccessKey,
                    sessionToken: creds.Credentials.SessionToken,
                };
                iamClient.login(params);
                return iamClient.deleteAccessKey(accessKey);
            })
            .then(() => dispatch(listAccountAccessKeys(accountID)))
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}
