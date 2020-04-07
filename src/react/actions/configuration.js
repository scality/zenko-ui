// @noflow
import { networkEnd, networkStart } from './network';
import type { ConfigurationOverlay } from '../../types/config';
import { getClients } from '../utils/actions';

export function newConfiguration(configuration: ConfigurationOverlay) {
    return {
        type: 'CONFIGURATION_VERSION',
        configuration,
    };
}

export function updateConfiguration() {
    return async (dispatch, getState) => {
        const { apiClient, instanceId } = getClients(getState());
        return apiClient.getConfigurationOverlayView({ uuid: instanceId })
            .then(res => {
                dispatch(newConfiguration(res.body));
            })
            .catch(error => {
                throw error;
            });
        //! errors will be handled by caller
    };
}
