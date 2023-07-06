import { History } from 'history';
import { until } from 'async';

import type {
  CloseLocationDeleteDialogAction,
  OpenLocationDeleteDialogAction,
  ThunkStatePromisedAction,
} from '../../types/actions';
import type { Location, LocationName } from '../../types/config';
import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import { updateConfiguration } from './configuration';
import { getClients } from '../utils/actions';
import { loadInstanceLatestStatus } from './stats';

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

export function waitForNewLocationToAppear(
  locationName: string,
): ThunkStatePromisedAction {
  return (dispatch, getState) =>
    until(
      (cb) => {
        const { instanceStatus } = getState();
        const includesLocation = Object.keys(
          instanceStatus.latest.state.latestConfigurationOverlay.locations,
        ).includes(locationName);
        setTimeout(cb, 500, null, includesLocation);
      },
      (next) => dispatch(loadInstanceLatestStatus()).then(next),
    );
}

export function waitForLocationToBeRemoved(
  locationName: string,
): ThunkStatePromisedAction {
  return (dispatch, getState) =>
    until(
      (cb) => {
        const { instanceStatus } = getState();
        const includesLocation = Object.keys(
          instanceStatus.latest.state.latestConfigurationOverlay.locations,
        ).includes(locationName);
        setTimeout(cb, 500, null, !includesLocation);
      },
      (next) => dispatch(loadInstanceLatestStatus()).then(next),
    );
}

export function saveLocation(
  location: Location,
  history: History,
): ThunkStatePromisedAction {
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
      .then(() => {
        dispatch(updateConfiguration());
        dispatch(waitForNewLocationToAppear(params.locationName));
        history.goBack();
      })
      .catch((error) => dispatch(handleClientError(error)))
      .catch((error) => {
        if (error instanceof Response) {
          return (
            error
              .json()
              .then((e) => dispatch(handleApiError(e, 'byComponent')))
              //@ts-expect-error intentionnaly ignore error/apierror type mismatch
              .catch(() => dispatch(handleApiError(error, 'byComponent')))
          );
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
      .then(() => dispatch(waitForLocationToBeRemoved(params.locationName)))
      .catch((error) => dispatch(handleClientError(error)))
      .catch((error) => dispatch(handleApiError(error, 'byModal')))
      .finally(() => {
        dispatch(networkEnd());
        dispatch(closeLocationDeleteDialog());
      });
  };
}
