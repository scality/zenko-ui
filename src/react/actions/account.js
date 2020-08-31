// @flow
import type {
    CloseAccountDeleteDialogAction,
    OpenAccountDeleteDialogAction,
    ThunkStatePromisedAction,
} from '../../types/actions';
import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import type { CreateAccountRequest } from '../../types/account';
import { assumeRoleWithWebIdentity } from './index';
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

export function createAccount(user: CreateAccountRequest): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        const params = { uuid: instanceId, user };
        dispatch(networkStart('Creating account'));
        return managementClient.createConfigurationOverlayUser(params)
            .then(resp => dispatch(assumeRoleWithWebIdentity(`arn:aws:iam::${resp.body.id}:role/roleForB`)))
            .then(() => dispatch(updateConfiguration()))
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
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => {
                dispatch(networkEnd());
                dispatch(closeAccountDeleteDialog());
            });
    };
}
