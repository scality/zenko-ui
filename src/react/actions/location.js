// @flow
import type { Location, LocationName }  from '../../types/config';
import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import type { ThunkStatePromisedAction }  from '../../types/actions';
import { getClients } from '../utils/actions';
import { goBack } from 'connected-react-router';
import { updateConfiguration } from './configuration';

export function selectLocation(locationName: LocationName) {
    return {
        type: 'SELECT_LOCATION',
        locationName,
    };
}

export function resetSelectLocation() {
    return {
        type: 'RESET_SELECT_LOCATION',
    };
}

export function openLocationDeleteDialog() {
    return {
        type: 'OPEN_LOCATION_DELETE_DIALOG',
    };
}

export function closeLocationDeleteDialog() {
    return {
        type: 'CLOSE_LOCATION_DELETE_DIALOG',
    };
}

export function saveLocation(location: Location): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        const params = {
            uuid: instanceId,
            location,
            locationName: location.name,
        };

        dispatch(networkStart('Saving Location'));
        const op = location.objectId ?
            managementClient.updateConfigurationOverlayLocation(params)
            :
            managementClient.createConfigurationOverlayLocation(params);
        return op
            .then(() => dispatch(updateConfiguration()))
            .then(() => dispatch(goBack()))
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byComponent')))
            .finally(() => dispatch(networkEnd()));
    };
}

// export function deleteLocation(locationName: LocationName): ThunkStatePromisedAction {
//     return (dispatch, getState) => {
//         const { managementClient, instanceId } = getClients(getState());
//         const params = {
//             uuid: instanceId,
//             locationName,
//         };
//         dispatch(closeLocationDeleteDialog());
//         dispatch(resetSelectLocation());
//         dispatch(networkStart('Deleting Location'));
//         return managementClient.deleteConfigurationOverlayLocation(params)
//             .then(() => {
//                 dispatch(updateConfiguration());
//             })
//             .catch(error => dispatch(handleClientError(error)))
//             .catch(error => dispatch(handleApiError(error, 'byModal')))
//             .finally(() => dispatch(networkEnd()));
//     };
// }
