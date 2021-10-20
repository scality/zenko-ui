// @flow
import type { APIWorkflows, Workflows } from '../../types/workflow';
import type { ReplicationStreams } from '../../types/config';
import type { WorkflowAction } from '../../types/actions';
import type { WorkflowState } from '../../types/state';
import { generateStreamName } from '../workflow/replication/utils';
import { initialWorkflowState } from './initialConstants';

const makeWorkflows = (apiWorkflows: APIWorkflows): Workflows => {
  const workflows = apiWorkflows
    .filter(w => !!w.replication)
    .map(w => {
      const r = w.replication;
      return {
        id: `replication-${r.streamId}`,
        type: 'replication',
        name: generateStreamName(r), // Until name get saved on the backend side.
        state: r.enabled,
        workflowId: r.streamId,
      };
    });
  // TODO: add expiration and transition rules.
  return workflows;
};

const makeReplication = (apiWorkflows: APIWorkflows): ReplicationStreams => {
  const workflows = apiWorkflows
    .filter(w => !!w.replication)
    .map(w => w.replication);
  return workflows;
};

export default function workflow(
  state: WorkflowState = initialWorkflowState,
  action: WorkflowAction,
): WorkflowState {
  switch (action.type) {
    case 'SEARCH_WORKFLOWS_SUCCESS':
      return {
        ...state,
        list: makeWorkflows(action.workflows),
        replications: makeReplication(action.workflows),
      };
    default:
      return state;
  }
}
