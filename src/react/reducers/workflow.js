// @flow
import type { APIWorkflows, Workflows } from '../../types/workflow';
import type { ReplicationStreams } from '../../types/config';
import type { WorkflowAction } from '../../types/actions';
import type { WorkflowState } from '../../types/state';
import { generateStreamName } from '../workflow/workflowTypes/replication/utils';
import { initialWorkflowState } from './initialConstants';

const makeWorkflows = (apiWorkflows: APIWorkflows): Workflows => {
    const workflows = apiWorkflows.reduce((workflows, w) => {
        if (w.replication) {
            const r = w.replication;
            workflows.push({
                id: `replication-${ r.streamId }`,
                bucketName: r.source.bucketName,
                type: 'replication',
                name: generateStreamName(r), // Until name get saved on the backend side.
                state: r.enabled,
                workflowId: r.streamId,
            });
        }
        // TODO: add expirations, transition rules.
        return workflows;
    }, []);
    return workflows;
};

const makeReplication = (apiWorkflows: APIWorkflows): ReplicationStreams => {
    const replications = apiWorkflows
        .filter(w => !!w.replication)
        .map(w => w.replication);
    return replications;
};

export default function workflow(state: WorkflowState = initialWorkflowState, action: WorkflowAction): WorkflowState {
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
