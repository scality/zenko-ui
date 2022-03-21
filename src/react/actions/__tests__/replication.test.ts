import * as actions from '../replication';
import * as dispatchAction from './utils/dispatchActionsList';
import {
  REPLICATION_WORKFLOW,
  errorManagementState,
  testDispatchFunction,
} from './utils/testUtil';
const deleteReplicationNetworkAction = dispatchAction.NETWORK_START_ACTION(
  'Deleting replication',
);
describe('replication actions', () => {
  const asyncTests = [
    {
      it: 'deleteReplication: should handle error',
      fn: actions.deleteReplication(REPLICATION_WORKFLOW),
      storeState: errorManagementState(),
      expectedActions: [
        deleteReplicationNetworkAction,
        dispatchAction.HANDLE_ERROR_MODAL_ACTION(
          'Management API Error Response',
        ),
        dispatchAction.NETWORK_END_ACTION,
        dispatchAction.CLOSE_WORKFLOW_DELETE_MODAL_ACTION(),
      ],
    },
  ];
  asyncTests.forEach(testDispatchFunction);
});
