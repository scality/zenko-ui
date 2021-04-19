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

// TO BE REMOVED BEFORE MERGE:
// function MOCK_SEARCH_WORKFLOWS() {
//     return Promise.resolve({
//         body: [
//             {
//                 'replication': {
//                     streamId: '123e4567-e89b-12d3-a456-426614174001',
//                     name: 'replication',
//                     version: 1,
//                     enabled: true,
//                     source: {
//                         prefix: 'myprefix',
//                         bucketName: 'bucket0',
//                     },
//                     destination: {
//                         locations: [{ name: 's3-loc' }],
//                         preferredReadLocation: 's3-loc',
//                     },
//                 },
//             },
//             {
//                 'replication': {
//                     streamId: '123e4567-e89b-12d3-a456-426614174002',
//                     name: 'replication2',
//                     version: 1,
//                     enabled: false,
//                     source: {
//                         prefix: 'myprefix2',
//                         bucketName: 'bucket2',
//                     },
//                     destination: {
//                         locations: [{ name: 'location-name2' }],
//                         preferredReadLocation: 'location-name2',
//                     },
//                 },
//             },
//         ],
//     });
// }

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
