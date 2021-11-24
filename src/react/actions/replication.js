// @noflow
import {
  closeWorkflowDeleteModal,
  closeWorkflowEditNotification,
  searchWorkflows,
} from './workflow';
import { getAccountId, getClients } from '../utils/actions';
import { handleApiError, handleClientError } from './error';
import { networkEnd, networkStart } from './network';
import type { Replication } from '../../types/config';
import type { ThunkStatePromisedAction } from '../../types/actions';
import { push } from 'connected-react-router';
import { roleName } from '../../js/IAMClient';

// TODO: Add delete approval process
export function deleteReplication(
  replication: Replication,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const state = getState();
    const { managementClient, instanceId } = getClients(state);
    const accountId = getAccountId(state);
    dispatch(networkStart('Deleting replication'));
    const params = {
      bucketName: replication.source.bucketName,
      instanceId,
      accountId,
      workflowId: replication.streamId,
      roleName,
    };
    return managementClient
      .deleteBucketWorkflowReplication(params)
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

export function saveReplication(
  replication: Replication,
): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const state = getState();
    const { managementClient, instanceId } = getClients(state);
    const accountId = getAccountId(state);
    dispatch(networkStart('Creating replication'));
    const params = {
      instanceId,
      workflow: replication,
      bucketName: replication.source.bucketName,
      accountId,
      roleName,
    };
    const op = replication.streamId
      ? managementClient.updateBucketWorkflowReplication({
          ...params,
          workflowId: replication.streamId,
        })
      : managementClient.createBucketWorkflowReplication(params);
    return op
      .then(resp => {
        return Promise.all([
          resp,
          dispatch(closeWorkflowEditNotification()),
          dispatch(searchWorkflows()),
        ]);
      })
      .then(([resp]) =>
        dispatch(push(`/workflows/replication-${resp.body.streamId}`)),
      )
      .catch(error => dispatch(handleClientError(error)))
      .catch(error => dispatch(handleApiError(error, 'byModal')))
      .finally(() => dispatch(networkEnd()));
  };
}
