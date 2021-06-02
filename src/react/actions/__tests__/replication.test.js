import * as actions from '../replication';
import * as dispatchAction from './utils/dispatchActionsList';
import {
    REPLICATION_WORKFLOW,
    errorManagementState,
    initState,
    testDispatchFunction,
} from './utils/testUtil';
import { searchWorkflowsActions } from './workflow.test.js';

const deleteReplicationNetworkAction = dispatchAction.NETWORK_START_ACTION('Deleting replication');
const createReplicationNetworkAction = dispatchAction.NETWORK_START_ACTION('Creating replication');

describe('replication actions', () => {
    const asyncTests = [
        {
            it: 'deleteReplication: should return expected actions',
            fn: actions.deleteReplication(REPLICATION_WORKFLOW),
            storeState: initState,
            expectedActions: [
                deleteReplicationNetworkAction,
                dispatchAction.CLOSE_WORKFLOW_EDIT_NOTIFICATION_ACTION(),
                ...searchWorkflowsActions,
                dispatchAction.LOCATION_PUSH_ACTION('/workflows'),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_WORKFLOW_DELETE_MODAL_ACTION(),
            ],
        },
        {
            it: 'deleteReplication: should handle error',
            fn: actions.deleteReplication(REPLICATION_WORKFLOW),
            storeState: errorManagementState(),
            expectedActions: [
                deleteReplicationNetworkAction,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('Management API Error Response'),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_WORKFLOW_DELETE_MODAL_ACTION(),
            ],
        },
        {
            it: 'saveReplication: should return expected actions',
            fn: actions.saveReplication(REPLICATION_WORKFLOW),
            storeState: initState,
            expectedActions: [
                createReplicationNetworkAction,
                dispatchAction.CLOSE_WORKFLOW_EDIT_NOTIFICATION_ACTION(),
                ...searchWorkflowsActions,
                dispatchAction.LOCATION_PUSH_ACTION(`/workflows/replication-${REPLICATION_WORKFLOW.streamId}`),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'saveReplication: should handle error',
            fn: actions.saveReplication(REPLICATION_WORKFLOW),
            storeState: errorManagementState(),
            expectedActions: [
                createReplicationNetworkAction,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('Management API Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
