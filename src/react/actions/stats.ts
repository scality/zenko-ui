// @noflow
import type { InstanceStatus, InstanceStatusAction } from '../../types/stats';
import { getClients } from '../utils/actions';
import { handleClientError } from './error';
export function instanceStatus(status: InstanceStatus): InstanceStatusAction {
  return {
    type: 'INSTANCE_STATUS',
    status,
  };
}
export function loadInstanceLatestStatus() {
  return (dispatch, getState) => {
    const { managementClient, instanceId } = getClients(getState());
    return managementClient
      .getLatestInstanceStatus({
        uuid: instanceId,
      })
      .then((res) => {
        dispatch(instanceStatus(res.body));
      })
      .catch((error) => dispatch(handleClientError(error)));
  };
}
