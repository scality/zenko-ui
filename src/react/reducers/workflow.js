// @flow
import type { APIWorkflows, Workflows } from '../../types/workflow';
import type { Expirations, ReplicationStreams } from '../../types/config';
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
        if (w.expiration) {
            const e = w.expiration;
            workflows.push({
                id: `expiration-${ e.workflowId }`,
                bucketName: e.bucketName,
                type: 'expiration',
                name: e.name,
                state: e.enabled,
                workflowId: e.workflowId,
            });
        }
        // TODO: add transition rules.
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

const makeExpirations = (apiWorkflows: APIWorkflows): Expirations => {
    const expirations = apiWorkflows
        .filter(w => !!w.expiration)
        .map(w => w.expiration);
    return expirations;
};

export default function workflow(state: WorkflowState = initialWorkflowState, action: WorkflowAction): WorkflowState {
    switch (action.type) {
    case 'SEARCH_WORKFLOWS_SUCCESS':
        return {
            ...state,
            list: makeWorkflows(action.workflows),
            replications: makeReplication(action.workflows),
            expirations: makeExpirations(action.workflows),
        };
    default:
        return state;
    }
}
