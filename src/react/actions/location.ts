import type {
  CloseLocationDeleteDialogAction,
  OpenLocationDeleteDialogAction,
  ThunkStatePromisedAction,
} from '../../types/actions';
import type { Location, LocationName } from '../../types/config';
import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import {
  updateConfiguration,
  waitForRunningConfigurationVersionUpdate,
} from './configuration';
import { getClients } from '../utils/actions';
import { goBack } from 'connected-react-router';
export function openLocationDeleteDialog(
  locationName: LocationName,
): OpenLocationDeleteDialogAction {
  return {
    type: 'OPEN_LOCATION_DELETE_DIALOG',
    locationName,
  };
}
export function closeLocationDeleteDialog(): CloseLocationDeleteDialogAction {
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
    dispatch(networkStart('Deploying location'));
    const op = location.objectId
      ? managementClient.updateConfigurationOverlayLocation(
          params.locationName,
          params.uuid,
          params.location,
        )
      : managementClient.createConfigurationOverlayLocation(
          params.location,
          params.uuid,
        );
    return op
      .then(() => dispatch(updateConfiguration()))
      .then(() => dispatch(waitForRunningConfigurationVersionUpdate()))
      .then(() => dispatch(goBack()))
      .catch((error) => dispatch(handleClientError(error)))
      .catch((error) => {
        if (error instanceof Response) {
          return error
            .json()
            .then((e) => dispatch(handleApiError(e, 'byComponent')))
            //@ts-expect-error intentionnaly ignore error/apierror type mismatch
            .catch(() => dispatch(handleApiError(error, 'byComponent')));
        }
        return dispatch(handleApiError(error, 'byComponent'));
      })
      .finally(() => dispatch(networkEnd()));
  };
}
export function deleteLocation(
  locationName: LocationName,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { managementClient, instanceId } = getClients(getState());
    const params = {
      uuid: instanceId,
      locationName,
    };
    dispatch(networkStart('Deleting location'));
    return managementClient
      .deleteConfigurationOverlayLocation(params.locationName, params.uuid)
      .then(() => dispatch(updateConfiguration()))
      .then(() => dispatch(waitForRunningConfigurationVersionUpdate()))
      .catch((error) => dispatch(handleClientError(error)))
      .catch((error) => dispatch(handleApiError(error, 'byModal')))
      .finally(() => {
        dispatch(networkEnd());
        dispatch(closeLocationDeleteDialog());
      });
  };
}
