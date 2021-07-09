// @flow
import { closeWorkflowDeleteModal, closeWorkflowEditNotification, searchWorkflows } from './workflow';
import { getAccountId, getClients } from '../utils/actions';
import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import type { Expiration } from '../../types/config';
import type { ThunkStatePromisedAction } from '../../types/actions';
import { push } from 'connected-react-router';

export function deleteExpiration(expiration: Expiration): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const state = getState();
        const { managementClient, instanceId } = getClients(state);
        const accountId = getAccountId(state);
        dispatch(networkStart('Deleting expiration'));
        const params = {
            bucketName: expiration.bucketName,
            instanceId,
            accountId,
            workflowId: expiration.workflowId,
        };
        return managementClient.deleteBucketWorkflowExpiration(params)
            .then(() => {
                dispatch(closeWorkflowEditNotification());
                return dispatch(searchWorkflows());
            })
            .then(() => dispatch(push('/workflows')))
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => {
                dispatch(networkEnd());
                dispatch(closeWorkflowDeleteModal());
            });
    };
}

export function saveExpiration(expiration: Expiration): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const state = getState();
        const { managementClient, instanceId } = getClients(state);
        const accountId = getAccountId(state);
        dispatch(networkStart('Creating expiration'));
        const params = {
            instanceId,
            workflow: expiration,
            bucketName: expiration.bucketName,
            accountId,
        };
        const op = expiration.workflowId ?
            managementClient.updateBucketWorkflowExpiration({ ...params, workflowId: expiration.workflowId }) :
            managementClient.createBucketWorkflowExpiration(params);
        return op.then(resp => {
            return Promise.all([
                resp,
                dispatch(closeWorkflowEditNotification()),
                dispatch(searchWorkflows()),
            ]);
        })
            .then(([resp]) => dispatch(push(`/workflows/expiration-${resp.body.workflowId}`)))
            .catch(error => dispatch(handleClientError(error)))
            .catch(error => dispatch(handleApiError(error, 'byModal')))
            .finally(() => dispatch(networkEnd()));
    };
}
