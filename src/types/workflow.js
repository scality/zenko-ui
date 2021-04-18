// @flow
import type { Replication } from './config';

export type APIReplicationWorkflow = {
    'replication': Replication,
} ;

export type APIWorkflows = Array<APIReplicationWorkflow>;

export type Workflow = {|
    +id: string,
    +type: 'replication' | 'transition' | 'expiration',
    +name: string,
    +state: boolean,
    +workflowId: string,
    +item: Replication,
|};

export type Workflows = Array<Workflow>;
