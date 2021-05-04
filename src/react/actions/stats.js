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

export function receiveInstanceStats(stats) {
    return {
        type: 'RECEIVE_INSTANCE_STATS',
        stats,
    };
}

export function loadInstanceStats(){
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        return managementClient.getInstanceStats({ uuid: instanceId })
            .then(res => {
                dispatch(receiveInstanceStats(res.body));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(() => {}); //? silence handleClientError if not an auth error
    };
}

export function loadInstanceLatestStatus(){
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        return managementClient.getLatestInstanceStatus({ uuid: instanceId })
            .then(res => {
                dispatch(instanceStatus(res.body));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(() => {}); //? silence handleClientError if not an auth error
    };
}
