import type {
  CloseWorkflowDeleteModalAction,
  CloseWorkflowEditNotificationAction,
  OpenWorkflowDeleteModalAction,
  OpenWorkflowEditNotificationAction,
  SearchWorkflowsSuccessAction,
  ThunkStatePromisedAction,
} from '../../types/actions';
import { getAccountId, getClients } from '../utils/actions';
import { networkEnd, networkStart } from './network';
import type { APIWorkflows } from '../../types/workflow';
import { rolePathName } from '../../js/IAMClient';
export function openWorkflowEditNotification(): OpenWorkflowEditNotificationAction {
  return {
    type: 'OPEN_WORKFLOW_EDIT_NOTIFICATION',
  };
}
export function closeWorkflowEditNotification(): CloseWorkflowEditNotificationAction {
  return {
    type: 'CLOSE_WORKFLOW_EDIT_NOTIFICATION',
  };
}
export function openWorkflowDeleteModal(): OpenWorkflowDeleteModalAction {
  return {
    type: 'OPEN_WORKFLOW_DELETE_MODAL',
  };
}
export function closeWorkflowDeleteModal(): CloseWorkflowDeleteModalAction {
  return {
    type: 'CLOSE_WORKFLOW_DELETE_MODAL',
  };
}
export function searchWorkflowsSuccess(
  workflows: APIWorkflows,
): SearchWorkflowsSuccessAction {
  return {
    type: 'SEARCH_WORKFLOWS_SUCCESS',
    workflows,
  };
}
export function searchWorkflows(): ThunkStatePromisedAction {
  return (dispatch, getState) => {
    const state = getState();
    const { managementClient, instanceId } = getClients(state);
    const accountId = getAccountId(state);
    dispatch(networkStart('Searching for worflows'));
    return managementClient
      .searchWorkflows(accountId, instanceId, rolePathName) // return MOCK_SEARCH_WORKFLOWS()
      .then((res) => dispatch(searchWorkflowsSuccess(res))) //!\ errors will have to be handled by caller
      .catch((error) => {
        throw error;
      })
      .finally(() => dispatch(networkEnd()));
  };
}
