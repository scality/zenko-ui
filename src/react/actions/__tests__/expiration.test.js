import * as actions from '../expiration';
import * as dispatchAction from './utils/dispatchActionsList';
import {
    EXPIRATION_WORKFLOW,
    errorManagementState,
    initState,
    testDispatchFunction,
} from './utils/testUtil';
import { searchWorkflowsActions } from './workflow.test.js';

const deleteExpirationNetworkAction = dispatchAction.NETWORK_START_ACTION('Deleting expiration');
const createExpirationNetworkAction = dispatchAction.NETWORK_START_ACTION('Creating expiration');

describe('expiration actions', () => {
    const asyncTests = [
        {
            it: 'deleteExpiration: should return expected actions',
            fn: actions.deleteExpiration(EXPIRATION_WORKFLOW),
            storeState: initState,
            expectedActions: [
                deleteExpirationNetworkAction,
                dispatchAction.CLOSE_WORKFLOW_EDIT_NOTIFICATION_ACTION(),
                ...searchWorkflowsActions,
                dispatchAction.LOCATION_PUSH_ACTION('/workflows'),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_WORKFLOW_DELETE_MODAL_ACTION(),
            ],
        },
        {
            it: 'deleteExpiration: should handle error',
            fn: actions.deleteExpiration(EXPIRATION_WORKFLOW),
            storeState: errorManagementState(),
            expectedActions: [
                deleteExpirationNetworkAction,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('Management API Error Response'),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_WORKFLOW_DELETE_MODAL_ACTION(),
            ],
        },
        {
            it: 'saveExpiration: should return expected actions',
            fn: actions.saveExpiration(EXPIRATION_WORKFLOW),
            storeState: initState,
            expectedActions: [
                createExpirationNetworkAction,
                dispatchAction.CLOSE_WORKFLOW_EDIT_NOTIFICATION_ACTION(),
                ...searchWorkflowsActions,
                dispatchAction.LOCATION_PUSH_ACTION(`/workflows/expiration-${EXPIRATION_WORKFLOW.workflowId}`),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'saveExpiration: should handle error',
            fn: actions.saveExpiration(EXPIRATION_WORKFLOW),
            storeState: errorManagementState(),
            expectedActions: [
                createExpirationNetworkAction,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('Management API Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
