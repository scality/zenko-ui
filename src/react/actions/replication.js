// @noflow
import { handleApiError, handleClientError } from './error';
import { getClients } from '../utils/actions';
import { updateConfiguration } from './configuration';


export function saveReplication(replication) {
    return (dispatch, getState) => {
        const { pensieveClient, instanceId } = getClients(getState());
        const params = {
            uuid: instanceId,
            replicationStream: replication,
        };
        const op = replication.streamId ?
            pensieveClient.updateConfigurationOverlayReplicationStream({ ...params, streamId: replication.streamId }) :
            pensieveClient.createConfigurationOverlayReplicationStream(replication);
        op.then(() => updateConfiguration())
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')));
    };
}
