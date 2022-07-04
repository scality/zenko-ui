import { UiFacingApi } from '../js/managementClient/api';
import { notFalsyTypeGuard } from '../types/typeGuards';
import { APIWorkflows, Workflows, Workflow } from '../types/workflow';
import { generateExpirationName, generateStreamName } from './workflow/utils';
import IAMClient from '../js/IAMClient';
import { QueryFunctionContext } from 'react-query';
import { getAccountSeeds } from '../js/vault';

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
  filters?: [],
) => {
  return {
    queryKey: ['workflowList', accountId, instanceId, rolePathName, filters],
    queryFn: (): Promise<APIWorkflows> => {
      if (onStart) {
        onStart();
      }
      return notFalsyTypeGuard(mgnt).searchWorkflows(
        accountId,
        instanceId,
        rolePathName,
        {
          bucketList: filters,
        },
      );
    },
    enabled: mgnt != null && accountId !== undefined,
  };
};

export const getUserAccessKeysQuery = (
  userName: string,
  IAMClient?: IAMClient | null,
) => ({
  queryKey: ['listIAMUserAccessKey', userName],
  queryFn: (_ctx: QueryFunctionContext, marker?: string) =>
    notFalsyTypeGuard(IAMClient).listAccessKeys(userName, marker),
  enabled: IAMClient !== null && IAMClient !== undefined,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getUserListGroupsQuery = (
  userName: string,
  IAMClient?: IAMClient | null,
) => ({
  queryKey: ['listIAMUserGroups', userName],
  queryFn: (_ctx: QueryFunctionContext, marker?: string) => {
    return notFalsyTypeGuard(IAMClient).listGroupsForUser(
      userName,
      1000,
      marker,
    );
  },
  staleTime: Infinity,
  enabled: IAMClient !== null && IAMClient !== undefined,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListUsersQuery = (
  accountName: string,
  IAMClient?: IAMClient | null,
) => ({
  queryKey: ['listIAMUsers', accountName],
  queryFn: (_ctx: QueryFunctionContext, marker?: string) =>
    notFalsyTypeGuard(IAMClient).listUsers(1000, marker),
  staleTime: Infinity,
  enabled: IAMClient !== null && IAMClient !== undefined,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListPoliciesQuery = (
  accountName: string,
  IAMClient?: IAMClient | null,
) => ({
  queryKey: ['listPolicies', accountName],
  queryFn: (_ctx: QueryFunctionContext, marker?: string) =>
    notFalsyTypeGuard(IAMClient).listPolicies(1000, marker),
  enabled: IAMClient !== null && IAMClient !== undefined,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListEntitiesForPolicyQuery = (
  policyArn: string,
  IAMClient?: IAMClient | null,
) => ({
  queryKey: ['listEntitiesForPolicy', policyArn],
  queryFn: (_ctx: QueryFunctionContext, marker?: string) =>
    notFalsyTypeGuard(IAMClient).listEntitiesForPolicy(policyArn, 1000, marker),
  enabled: IAMClient !== null && IAMClient !== undefined,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListGroupsQuery = (
  accountName: string,
  IAMClient?: IAMClient | null,
) => ({
  queryKey: ['listGroups', accountName],
  queryFn: (_ctx: QueryFunctionContext, marker?: string) =>
    notFalsyTypeGuard(IAMClient).listGroups(1000, marker),
  staleTime: Infinity,
  enabled: IAMClient !== null && IAMClient !== undefined,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListRolesQuery = (
  accountName: string,
  IAMClient?: IAMClient | null,
) => ({
  queryKey: ['listRoles', accountName],
  queryFn: (_ctx: QueryFunctionContext, marker?: string) =>
    notFalsyTypeGuard(IAMClient).listRoles(1000, marker),
  staleTime: Infinity,
  enabled: IAMClient !== null && IAMClient !== undefined,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListAttachedUserPoliciesQuery = (
  userName: string,
  accountName: string,
  IAMClient?: IAMClient | null,
) => ({
  queryKey: ['listAttachedUserPolicies', userName, accountName],
  queryFn: () =>
    notFalsyTypeGuard(IAMClient).listAttachedUserPolicies(userName),
  staleTime: Infinity,
  enabled: IAMClient !== null && IAMClient !== undefined,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getPolicyQuery = (
  policyArn: string,
  defaultVersionId: string,
  IAMClient: IAMClient,
) => ({
  queryKey: ['getPolicy', policyArn, defaultVersionId],
  queryFn: () => IAMClient.getPolicyVersion(policyArn, defaultVersionId),
  enabled: IAMClient !== null,
  refetchOnWindowFocus: false,
});

export const getListPolicyVersionsQuery = (
  policyArn: string,
  IAMClient?: IAMClient | null,
) => {
  return {
    queryKey: ['listPolicyVersions', policyArn],
    queryFn: () => notFalsyTypeGuard(IAMClient).listPolicyVersions(policyArn),
    enabled: IAMClient !== null && IAMClient !== undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  };
};

export const getAccountSeedsQuery = () => ({
  queryKey: ['AccountSeeds'],
  queryFn: getAccountSeeds,
});
