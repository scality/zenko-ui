// @flow
import type { Replication } from './config';

export type APIReplicationWorkflow = {
    replication: Replication,
};

export type APIWorkflows = Array<APIReplicationWorkflow>;

export type WorkflowType = 'replication' | 'transition' | 'expiration';

export type Workflow = {|
    +id: string,
    +bucketName: string,
    +type: WorkflowType,
    +name: string,
    +state: boolean,
    +workflowId: string,
|};

export type Workflows = Array<Workflow>;
