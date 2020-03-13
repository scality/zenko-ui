import { handleApiError, handleClientError } from './error';
import creds from '../../../creds';

const instanceId = creds.instanceId;

export function receiveInstanceStats(stats) {
    return {
        type: 'RECEIVE_INSTANCE_STATS',
        stats,
    };
}

export function loadInstanceStats(){
    return (dispatch, getState) => {
        const client = getState().pensieveClient.client;
        return client.getInstanceStats({ uuid: instanceId})
            .then(res => {
                console.log('getLatestInstanceStatus => res.body!!!', res.body);
                dispatch(receiveInstanceStats(res.body));
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}
