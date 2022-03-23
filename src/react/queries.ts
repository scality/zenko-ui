import { UiFacingApi } from '../js/managementClient/api';
import { ApiError } from '../types/actions';
import { notFalsyTypeGuard } from '../types/typeGuards';
import { APIWorkflows, Workflows, Workflow } from '../types/workflow';
import { generateStreamName } from './workflow/utils';

// Copy paste form legacy redux workflow
export const makeWorkflows = (apiWorkflows: APIWorkflows): Workflows => {
  const workflows = apiWorkflows
    .filter((w) => !!w.replication)
    .map((w) => {
      const r = w.replication;
      return {
        id: `replication-${r.streamId}`,
        type: 'replication',
        name: generateStreamName(r),
        // Until name get saved on the backend side.
        state: r.enabled,
        workflowId: r.streamId,
      } as Workflow;
    });
  // TODO: add expiration and transition rules.
  return workflows;
};

export const workflowListQuery = (
  mgnt: UiFacingApi,
  accountId: string,
  instanceId: string,
  rolePathName: string,
) => {
  return {
    queryKey: ['workflowList', accountId, instanceId, rolePathName],
    queryFn: (): Promise<APIWorkflows> => {
      return notFalsyTypeGuard(mgnt)
        .searchWorkflows(accountId, instanceId, rolePathName)
        .catch((error: ApiError) => {
          throw error;
        });
    },
    enabled: mgnt != null,
  };
};
