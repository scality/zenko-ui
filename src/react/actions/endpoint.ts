import type {
  CloseEndpointDeleteDialogAction,
  OpenEndpointDeleteDialogAction,
  ThunkStatePromisedAction,
} from '../../types/actions';
import type { Hostname, LocationName } from '../../types/config';
import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import {
  updateConfiguration,
  waitForRunningConfigurationVersionUpdate,
} from './configuration';
import { getClients } from '../utils/actions';
import { push } from 'connected-react-router';
export function openEndpointDeleteDialog(
  hostname: Hostname,
): OpenEndpointDeleteDialogAction {
  return {
    type: 'OPEN_ENDPOINT_DELETE_DIALOG',
    hostname,
  };
}
export function closeEndpointDeleteDialog(): CloseEndpointDeleteDialogAction {
  return {
    type: 'CLOSE_ENDPOINT_DELETE_DIALOG',
  };
}
export function createEndpoint(
  hostname: Hostname,
  locationName: LocationName,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { managementClient, instanceId } = getClients(getState());
    dispatch(networkStart('Deploying Data Service'));
    const params = {
      uuid: instanceId,
      endpoint: {
        hostname,
        locationName,
        isBuiltin: false,
      },
    };
    return managementClient
      .createConfigurationOverlayEndpoint(params.endpoint, params.uuid)
      .then(() => dispatch(updateConfiguration()))
      .then(() => dispatch(waitForRunningConfigurationVersionUpdate()))
      .then(() => dispatch(push('/dataservices')))
      .catch((error) => dispatch(handleClientError(error)))
      .catch((error) => dispatch(handleApiError(error, 'byComponent')))
      .finally(() => dispatch(networkEnd()));
  };
}
export function deleteEndpoint(hostname: Hostname): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const { managementClient, instanceId } = getClients(getState());
    dispatch(closeEndpointDeleteDialog());
    dispatch(networkStart('Deleting Data Service'));
    const params = {
      uuid: instanceId,
      hostname,
    };
    return managementClient
      .deleteConfigurationOverlayEndpoint(params.hostname, params.uuid)
      .then(() => dispatch(updateConfiguration()))
      .then(() => dispatch(waitForRunningConfigurationVersionUpdate()))
      .catch((error) => dispatch(handleClientError(error)))
      .catch((error) => dispatch(handleApiError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
