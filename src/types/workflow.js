// @flow
import type { Expiration, Replication } from './config';

export type APIReplicationWorkflow = {
    replication: Replication,
    expiration: Expiration,
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
