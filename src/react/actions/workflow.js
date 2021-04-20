// @flow
import type {
    CloseWorkflowEditNotificationAction,
    OpenWorkflowEditNotificationAction,
    SearchWorkflowsSuccessAction,
    ThunkStatePromisedAction,
} from '../../types/actions';
import { getAccountId, getClients } from '../utils/actions';
import { networkEnd, networkStart } from './network';
import type { APIWorkflows } from '../../types/workflow';

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

export function searchWorkflowsSuccess(workflows: APIWorkflows): SearchWorkflowsSuccessAction {
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
