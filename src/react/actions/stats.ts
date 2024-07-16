// @noflow
import { InstanceStatus } from '../../types/stats';
import { getClients } from '../utils/actions';
import { handleClientError } from './error';
export function instanceStatus(status: InstanceStatus) {
  return {
    type: 'INSTANCE_STATUS',
    status,
  };
}
export function loadInstanceLatestStatus() {
  return (dispatch, getState) => {
    const { managementClient, instanceId } = getClients(getState());
    return managementClient
      .getLatestInstanceStatus(instanceId)
      .then((res) => {
        //@ts-expect-error fix this when you are working on it
        dispatch(instanceStatus(res));
      })
      .catch((error) => dispatch(handleClientError(error)));
  };
}
