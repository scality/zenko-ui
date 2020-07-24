// @flow

import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import type { Account } from '../../types/account';
import type { ThunkStatePromisedAction}  from '../../types/actions';
import { getClients } from '../utils/actions';
import { push } from 'connected-react-router';

export function createAccount(user: Account): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        const params = { uuid: instanceId, user };
        dispatch(networkStart('Creating account'));
        return managementClient.createConfigurationOverlayUser(params)
            .then(() => {
                // TODO: need to change redirect path
                dispatch(push('/'));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}
