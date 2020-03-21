// @noflow
import { networkEnd, networkStart } from './network';
import type { ConfigurationOverlay } from '../../types/config';
import creds from '../../../creds';
import { getClients } from '../utils/actions';

export function newConfiguration(configuration: ConfigurationOverlay) {
    return {
        type: 'CONFIGURATION_VERSION',
        configuration,
    };
}

export function updateConfiguration() {
    return async (dispatch, getState) => {
        const { pensieveClient, instanceId } = getClients(getState());
        return pensieveClient.getConfigurationOverlayView({ uuid: instanceId })
            .then(res => {
                dispatch(newConfiguration(res.body));
            })
            .catch(error => {
                throw error;
            });
        //! errors will be handled by caller
    };
}
