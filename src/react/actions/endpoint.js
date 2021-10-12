// @flow
import type { Hostname, LocationName } from '../../types/config';
import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import { updateConfiguration, waitForRunningConfigurationVersionUpdate } from './configuration';
import type { ThunkStatePromisedAction } from '../../types/actions';
import { getClients } from '../utils/actions';
import { push } from 'connected-react-router';



export function createEndpoint(hostname: Hostname, locationName: LocationName): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        dispatch(networkStart('Deploying Data Service'));
        const params = {
            uuid: instanceId,
            endpoint: { hostname, locationName, isBuiltin: false },
        };
        return managementClient.createConfigurationOverlayEndpoint(params)
            .then(() => dispatch(updateConfiguration()))
            .then(() => dispatch(waitForRunningConfigurationVersionUpdate()))
            .then(() => dispatch(push('/dataservice')))
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}
