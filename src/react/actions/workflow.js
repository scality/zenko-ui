// @flow
import type { APIWorkflows, Workflow } from '../../types/workflow';
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
import { deleteReplication } from './replication';

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

export function searchWorkflowsSuccess(workflows: APIWorkflows): SearchWorkflowsSuccessAction {
    return {
        type: 'SEARCH_WORKFLOWS_SUCCESS',
        workflows,
    };
}

export function deleteWorkflow(workflow: Workflow): ?ThunkStatePromisedAction {
    if (workflow.type === 'replication')
        return deleteReplication(workflow);
}

export function searchWorkflows(): ThunkStatePromisedAction {
    return (dispatch, getState) => {
        const state = getState();
        const { managementClient, instanceId } = getClients(state);
        const accountId = getAccountId(state);
        dispatch(networkStart('Searching for workflows'));
        const params = {
            instanceId,
            accountId,
        };
        return managementClient.searchWorkflows(params)
        // return MOCK_SEARCH_WORKFLOWS()
            .then(res => dispatch(searchWorkflowsSuccess(res.body)))
            //!\ errors will have to be handled by caller
            .catch(error => { throw error; })
            .finally(() => dispatch(networkEnd()));
    };
}
