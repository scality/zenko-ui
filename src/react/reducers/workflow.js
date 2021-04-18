// @flow
import type { APIWorkflows, Workflows } from '../../types/workflow';
import type { WorkflowAction } from '../../types/actions';
import type { WorkflowState } from '../../types/state';
import { initialWorkflowState } from './initialConstants';

const makeWorkflows = (apiWorkflows: APIWorkflows): Workflows => {
    const workflows = apiWorkflows
        .filter(w => !!w.replication)
        .map(w => {
            const r = w.replication;
            return {
                id: `replication-${r.streamId}`,
                type: 'replication',
                name: r.name,
                state: r.enabled,
                workflowId: r.streamId,
                item: r,
            };
        });
    // TODO: add expiration and transition rules.
    return workflows;
};

export default function workflow(state: WorkflowState = initialWorkflowState, action: WorkflowAction): WorkflowState {
    switch (action.type) {
    case 'SEARCH_WORKFLOWS_SUCCESS':
        return {
            ...state,
            list: makeWorkflows(action.workflows),
        };
    default:
        return state;
    }
}
