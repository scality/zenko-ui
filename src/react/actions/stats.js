// @noflow

import { handleApiError, handleClientError } from './error';
import { getClients } from '../utils/actions';

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
        const { pensieveClient, instanceId } = getClients(getState());
        return pensieveClient.getInstanceStats({ uuid: instanceId})
            .then(res => {
                dispatch(receiveInstanceStats(res.body));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}

export function loadInstanceLatestStatus(){
    return (dispatch, getState) => {
        const { pensieveClient, instanceId } = getClients(getState());
        return pensieveClient.getLatestInstanceStatus({ uuid: instanceId})
            .then(res => {
                dispatch(instanceStatus(res.body));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}
