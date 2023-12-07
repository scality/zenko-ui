import { AWSError, S3 } from 'aws-sdk';
import {
  AccessKeyMetadata,
  Group,
  ListAccessKeysResponse,
  ListEntitiesForPolicyResponse,
  ListGroupsForUserResponse,
  ListGroupsResponse,
  ListPoliciesResponse,
  ListRolesResponse,
  ListUsersResponse,
  Policy,
  Role,
  User,
} from 'aws-sdk/clients/iam';
import { ListObjectVersionsOutput } from 'aws-sdk/clients/s3';
import { InfiniteData } from 'react-query';
import IAMClient from '../js/IAMClient';
import { UiFacingApi } from '../js/managementClient/api';
import { getAccountSeeds } from '../js/vault';
import { notFalsyTypeGuard } from '../types/typeGuards';
import { APIWorkflows, Workflow, Workflows } from '../types/workflow';
import { AWS_PAGINATED_QUERY } from './utils/IAMhooks';
import {
  generateExpirationName,
  generateStreamName,
  generateTransitionName,
} from './workflow/utils';
import { VEEAM_XML_PREFIX } from './ui-elements/Veeam/VeeamConstants';

// Copy paste form legacy redux workflow
export const makeWorkflows = (apiWorkflows: APIWorkflows): Workflows => {
  const workflows = apiWorkflows
    .filter((w) => !!w.replication || !!w.expiration || !!w.transition)
    .map((w) => {
      if (w.replication) {
        const r = w.replication;
        return {
          id: `replication-${r.streamId}`,
          type: 'replication' as const,
          name: generateStreamName(r),
          // Until name get saved on the backend side.
          state: r.enabled,
          workflowId: r.streamId,
        } as Workflow;
      } else if (w.expiration) {
        const r = w.expiration;
        return {
          id: `expiration-${r.workflowId}`,
          type: 'expiration' as const,
          name: generateExpirationName(r),
          state: r.enabled,
          workflowId: r.workflowId,
        } as Workflow;
      } else {
        const r = w.transition;
        return {
          id: `transition-${r.workflowId}`,
          type: 'transition' as const,
          name: generateTransitionName(r),
          state: r.enabled,
          workflowId: r.workflowId || '',
        };
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
  filters?: string[],
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
  IAMClient: IAMClient,
): AWS_PAGINATED_QUERY<
  ListAccessKeysResponse,
  AccessKeyMetadata,
  AWSError
> => ({
  queryKey: ['listIAMUserAccessKey', userName],
  queryFn: (_ctx, marker) => IAMClient.listAccessKeys(userName, marker?.Marker),
  enabled: !!IAMClient && !!IAMClient.client,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getUserListGroupsQuery = (
  userName: string,
  IAMClient: IAMClient,
): AWS_PAGINATED_QUERY<ListGroupsForUserResponse, Group, AWSError> => ({
  queryKey: ['listIAMUserGroups', userName],
  queryFn: (_ctx, marker) => {
    return IAMClient.listGroupsForUser(userName, 1000, marker?.Marker);
  },
  staleTime: Infinity,
  enabled: !!IAMClient && !!IAMClient.client,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListUsersQuery = (
  accountName: string,
  IAMClient: IAMClient,
): AWS_PAGINATED_QUERY<ListUsersResponse, User, AWSError> => ({
  queryKey: ['listIAMUsers', accountName],
  queryFn: (_ctx, marker) => IAMClient.listUsers(1000, marker?.Marker),
  staleTime: Infinity,
  enabled: !!IAMClient && !!IAMClient.client,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListPoliciesQuery = (
  accountName: string,
  IAMClient: IAMClient,
): AWS_PAGINATED_QUERY<ListPoliciesResponse, Policy, AWSError> => ({
  queryKey: ['listPolicies', accountName],
  queryFn: (_ctx, marker) => IAMClient.listPolicies(1000, marker?.Marker),
  enabled: !!IAMClient && !!IAMClient.client,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListEntitiesForPolicyQuery = (
  policyArn: string,
  IAMClient: IAMClient,
): AWS_PAGINATED_QUERY<ListEntitiesForPolicyResponse, unknown, AWSError> => ({
  queryKey: ['listEntitiesForPolicy', policyArn],
  queryFn: (_ctx, marker) =>
    IAMClient.listEntitiesForPolicy(policyArn, 1000, marker?.Marker),
  enabled: !!IAMClient && !!IAMClient.client,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListGroupsQuery = (
  accountName: string,
  IAMClient: IAMClient,
): AWS_PAGINATED_QUERY<ListGroupsResponse, Group, AWSError> => ({
  queryKey: ['listGroups', accountName],
  queryFn: (_ctx, marker) => IAMClient.listGroups(1000, marker?.Marker),
  staleTime: Infinity,
  enabled: !!IAMClient && !!IAMClient.client,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListRolesQuery = (
  accountName: string,
  IAMClient: IAMClient,
): AWS_PAGINATED_QUERY<ListRolesResponse, Role, AWSError> => ({
  queryKey: ['listRoles', accountName],
  queryFn: (_ctx, marker) => IAMClient.listRoles(1000, marker?.Marker),
  staleTime: Infinity,
  enabled: !!IAMClient && !!IAMClient.client,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListAttachedUserPoliciesQuery = (
  userName: string,
  accountName: string,
  IAMClient: IAMClient,
) => ({
  queryKey: ['listAttachedUserPolicies', userName, accountName],
  queryFn: () => IAMClient.listAttachedUserPolicies(userName),
  staleTime: Infinity,
  enabled: !!IAMClient && !!IAMClient.client,
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
  IAMClient: IAMClient,
) => {
  return {
    queryKey: ['listPolicyVersions', policyArn],
    queryFn: () => IAMClient.listPolicyVersions(policyArn),
    enabled: !!IAMClient && !!IAMClient.client,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  };
};

export const getAccountSeedsQuery = (basePath: string) => ({
  queryKey: ['AccountSeeds'],
  queryFn: () => getAccountSeeds(basePath),
});

interface GetObjectVersionProps {
  bucketName: string;
  s3Client: S3;
  enabled?: boolean;
  isInfinite?: boolean;
  maxKeys?: number;
  queryKey?: unknown[];
}

export const getObjectsVersions = ({
  bucketName,
  s3Client,
  enabled = true,
  isInfinite = false,
  maxKeys = 1000,
  queryKey = ['objectVersions', bucketName],
}: GetObjectVersionProps): AWS_PAGINATED_QUERY<
  ListObjectVersionsOutput,
  S3.ObjectIdentifier,
  AWSError,
  ListObjectVersionsOutput
> => ({
  queryKey,
  queryFn: (_, marker) =>
    s3Client
      .listObjectVersions({
        Bucket: bucketName,
        KeyMarker: marker?.NextKeyMarker,
        VersionIdMarker: marker?.NextVersionIdMarker,
        MaxKeys: maxKeys,
      })
      .promise(),
  enabled,
  select: (data) => {
    if (isInfinite) {
      const infiniteData = data as InfiniteData<ListObjectVersionsOutput>;
      const pages = infiniteData.pages?.flatMap((d) => d);

      return {
        pages,
        pageParams: infiniteData.pageParams,
      } as ListObjectVersionsOutput;
    }
    return data;
  },
  getNextPageParam: ({ IsTruncated, NextKeyMarker, NextVersionIdMarker }) =>
    IsTruncated
      ? {
          NextKeyMarker,
          NextVersionIdMarker,
        }
      : undefined,
});

export const getObjectQuery = ({
  bucketName,
  s3Client,
  key,
}: {
  bucketName: string;
  s3Client: S3;
  key: string;
}) => ({
  queryKey: ['getObjectQuery', bucketName],
  queryFn: () => {
    return s3Client.getObject({ Bucket: bucketName, Key: key }).promise();
  },
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});
