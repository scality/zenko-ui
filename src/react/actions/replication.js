// @noflow
import type { Replication, Rule } from '../../types/config';
import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import type { ThunkStatePromisedAction } from '../../types/actions';
import { closeWorkflowEditNotification } from './workflow';
import { getClients } from '../utils/actions';
import { push } from 'connected-react-router';
import { updateConfiguration } from './configuration';

// TODO: Add delete approval process
export function deleteReplication(rule: Rule): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        dispatch(networkStart('Deleting replication'));
        const params = {
            uuid: instanceId,
            streamId: rule.ruleId,
        };
        return managementClient.deleteConfigurationOverlayReplicationStream(params)
            .then(() => dispatch(updateConfiguration()))
            .then(() => {
                dispatch(push('/workflows'));
                dispatch(closeWorkflowEditNotification());
            })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}

export function saveReplication(replication: Replication): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const { managementClient, instanceId } = getClients(getState());
        dispatch(networkStart('Creating replication'));
        const params = {
            uuid: instanceId,
            replicationStream: replication,
        };
        const op = replication.streamId ?
            managementClient.updateConfigurationOverlayReplicationStream({ ...params, streamId: replication.streamId }) :
            managementClient.createConfigurationOverlayReplicationStream(params);
        return op.then(rep => {
            return Promise.all([rep, dispatch(updateConfiguration())]);
        }).then(([rep]) => {
            dispatch(closeWorkflowEditNotification());
            dispatch(push(`/workflows/replication-${rep.body.streamId}`));
        })
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}
