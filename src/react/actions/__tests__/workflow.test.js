import * as actions from '../workflow';
import * as dispatchAction from './utils/dispatchActionsList';

import {
  WORKFLOWS,
  authenticatedUserState,
  errorManagementState,
  testActionFunction,
  testDispatchErrorTestFn,
  testDispatchFunction,
} from './utils/testUtil';

const searchWorkflowsNetworkAction = dispatchAction.NETWORK_START_ACTION(
  'Searching for worflows',
);

export const searchWorkflowsActions = [
  searchWorkflowsNetworkAction,
  dispatchAction.SEARCH_WORKFLOWS_SUCCESS_ACTION(),
  dispatchAction.NETWORK_END_ACTION,
];

describe('workflow actions', () => {
  const syncTests = [
    {
      it: 'should return OPEN_WORKFLOW_EDIT_NOTIFICATION action',
      fn: actions.openWorkflowEditNotification(),
      expectedActions: [
        dispatchAction.OPEN_WORKFLOW_EDIT_NOTIFICATION_ACTION(),
      ],
    },
    {
      it: 'should return CLOSE_WORKFLOW_EDIT_NOTIFICATION action',
      fn: actions.closeWorkflowEditNotification(),
      expectedActions: [
        dispatchAction.CLOSE_WORKFLOW_EDIT_NOTIFICATION_ACTION(),
      ],
    },
    {
      it: 'should return OPEN_WORKFLOW_DELETE_MODAL action',
      fn: actions.openWorkflowDeleteModal(),
      expectedActions: [dispatchAction.OPEN_WORKFLOW_DELETE_MODAL_ACTION()],
    },
    {
      it: 'should return CLOSE_WORKFLOW_DELETE_MODAL action',
      fn: actions.closeWorkflowDeleteModal(),
      expectedActions: [dispatchAction.CLOSE_WORKFLOW_DELETE_MODAL_ACTION()],
    },
    {
      it: 'should return SEARCH_WORKFLOWS_SUCCESS action',
      fn: actions.searchWorkflowsSuccess(WORKFLOWS),
      expectedActions: [dispatchAction.SEARCH_WORKFLOWS_SUCCESS_ACTION()],
    },
  ];

  syncTests.forEach(testActionFunction);

  const asyncTests = [
    {
      it: 'searchWorkflows: should return expected actions',
      fn: actions.searchWorkflows(),
      storeState: authenticatedUserState(),
      expectedActions: [
        searchWorkflowsNetworkAction,
        dispatchAction.SEARCH_WORKFLOWS_SUCCESS_ACTION(),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
  ];

  asyncTests.forEach(testDispatchFunction);

  testDispatchErrorTestFn(
    {
      message: 'Management API Error Response',
    },
    {
      it: 'searchWorkflows: should handle error',
      fn: actions.searchWorkflows(),
      storeState: errorManagementState(),
      expectedActions: [
        searchWorkflowsNetworkAction,
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
  );
});
