import type { Replication } from './config';
export type APIReplicationWorkflow = {
  replication: Replication;
};
export type APIWorkflows = Array<APIReplicationWorkflow>;
export type Workflow = {
  readonly id: string;
  readonly type: 'replication' | 'transition' | 'expiration';
  readonly name: string;
  readonly state: boolean;
  readonly workflowId: string;
};
export type Workflows = Array<Workflow>;