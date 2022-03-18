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
import { rolePathName } from '../../js/IAMClient';

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
      rolePathName,
    };
    return managementClient
      .deleteBucketWorkflowReplication(
        params.bucketName,
        params.instanceId,
        params.accountId,
        params.workflowId,
        params.rolePathName,
      )
      .then(() => {
        dispatch(closeWorkflowEditNotification());
        return dispatch(searchWorkflows());
      })
      .then(() => dispatch(push('/workflows')))
      .catch((error) => dispatch(handleClientError(error)))
      .catch((error) => dispatch(handleApiError(error, 'byModal')))
      .finally(() => {
        dispatch(networkEnd());
        dispatch(closeWorkflowDeleteModal());
      });
  };
}
