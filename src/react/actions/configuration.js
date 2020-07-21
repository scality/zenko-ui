// @flow

import type { ConfigurationVersionAction, ThunkStatePromisedAction } from '../../types/actions';
import type { ConfigurationOverlay } from '../../types/config';
import { getClients } from '../utils/actions';

export function newConfiguration(configuration: ConfigurationOverlay): ConfigurationVersionAction {
    return {
        type: 'CONFIGURATION_VERSION',
        configuration,
    };
}

export function updateConfiguration(): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        return managementClient.getConfigurationOverlayView({ uuid: instanceId })
            .then(res => {
                dispatch(newConfiguration(res.body));
            })
            .catch(error => {
                throw error;
            });
        //! errors will be handled by caller
    };
}
