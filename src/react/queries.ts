import { UiFacingApi } from '../js/managementClient/api';
import { notFalsyTypeGuard } from '../types/typeGuards';
import { APIWorkflows, Workflows, Workflow } from '../types/workflow';
import { generateExpirationName, generateStreamName } from './workflow/utils';

// Copy paste form legacy redux workflow
export const makeWorkflows = (apiWorkflows: APIWorkflows): Workflows => {
  const workflows = apiWorkflows
    .filter((w) => !!w.replication || !!w.expiration)
    .map((w) => {
      if (w.replication) {
        const r = w.replication;
        return {
          id: `replication-${r.streamId}`,
          type: 'replication',
          name: generateStreamName(r),
          // Until name get saved on the backend side.
          state: r.enabled,
          workflowId: r.streamId,
        } as Workflow;
      } else {
        const r = w.expiration;
        return {
          id: `expiration-${r.workflowId}`,
          type: 'expiration',
          name: generateExpirationName(r),
          state: r.enabled,
          workflowId: r.workflowId,
        } as Workflow;
      }
      
    });
  // TODO: add expiration and transition rules.
  return workflows;
};

export const workflowListQuery = (
  mgnt: UiFacingApi,
  accountId: string,
  instanceId: string,
  rolePathName: string,
  onStart?: () => void,
) => {
  return {
    queryKey: ['workflowList', accountId, instanceId, rolePathName],
    queryFn: (): Promise<APIWorkflows> => {
       if (onStart) {
         onStart();
       }
      return notFalsyTypeGuard(mgnt)
        .searchWorkflows(accountId, instanceId, rolePathName);
    },
    enabled: mgnt != null,
  };
};
