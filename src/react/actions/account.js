import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import { getClients } from '../utils/actions';
import { push } from 'connected-react-router';

export function createAccount(user) {
    return (dispatch, getState) => {
        const { apiClient, instanceId } = getClients(getState());
        console.log('user!!!', user);
        const params = { uuid: instanceId, user };
        dispatch(networkStart('Creating account'));
        return apiClient.createConfigurationOverlayUser(params)
            .then(resp => {
                // TODO: need to change redirect path
                dispatch(push('/'));
            })
            .catch(error => { console.log('err', error); dispatch(handleClientError(error)); })
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}
