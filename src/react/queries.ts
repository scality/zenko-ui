import { useShellHooks } from '@scality/module-federation';
import type { AWSError } from 'aws-sdk';
import type {
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
import { useMemo } from 'react';
import { type QueryOptions, useQuery } from 'react-query';
import type IAMClient from '../js/IAMClient';
import { getAccountSeeds } from '../js/vault';
import { useDeployedMetalk8sInstances } from './next-architecture/ui/ConfigProvider';
import type { ZenkoCR } from './truststore/Truststore';
import type { AWS_PAGINATED_QUERY } from './utils/IAMhooks';

export const getUserAccessKeysQuery = (
  userName: string,
  IAMClient: IAMClient,
): AWS_PAGINATED_QUERY<ListAccessKeysResponse, AccessKeyMetadata, AWSError> => ({
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
  additionalDeps: unknown[] = [],
): AWS_PAGINATED_QUERY<ListUsersResponse, User, AWSError> => ({
  queryKey: ['listIAMUsers', accountName, ...additionalDeps],
  queryFn: (_ctx, marker) => IAMClient.listUsers(1000, marker?.Marker),
  staleTime: Infinity,
  enabled: !!IAMClient && !!IAMClient.client,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getListPoliciesQuery = (
  accountName: string,
  IAMClient: IAMClient,
  additionalDeps: unknown[] = [],
): AWS_PAGINATED_QUERY<ListPoliciesResponse, Policy, AWSError> => ({
  queryKey: ['listPolicies', accountName, ...additionalDeps],
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
  queryFn: (_ctx, marker) => IAMClient.listEntitiesForPolicy(policyArn, 1000, marker?.Marker),
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

export const getListAttachedUserPoliciesQuery = (userName: string, accountName: string, IAMClient: IAMClient) => ({
  queryKey: ['listAttachedUserPolicies', userName, accountName],
  queryFn: () => IAMClient.listAttachedUserPolicies(userName),
  staleTime: Infinity,
  enabled: !!IAMClient && !!IAMClient.client,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});

export const getPolicyQuery = (policyArn: string, defaultVersionId: string, IAMClient: IAMClient) => ({
  queryKey: ['getPolicy', policyArn, defaultVersionId],
  queryFn: () => IAMClient.getPolicyVersion(policyArn, defaultVersionId),
  enabled: IAMClient !== null,
  refetchOnWindowFocus: false,
});

export const getPolicyInfoQuery = (policyArn: string, IAMClient: IAMClient) => ({
  queryKey: ['getPolicyInfo', policyArn],
  queryFn: () => IAMClient.getPolicy(policyArn),
  enabled: IAMClient !== null,
  refetchOnWindowFocus: false,
});

export const getListPolicyVersionsQuery = (policyArn: string, IAMClient: IAMClient) => {
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

export const getZenkoCRQuery = (): QueryOptions<ZenkoCR> => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const { useConfigRetriever } = useShellHooks();
  const { retrieveConfiguration } = useConfigRetriever();
  const instances = useDeployedMetalk8sInstances();
  const getURL = (instances) => {
    if (instances.length) {
      const runTimeConfig = retrieveConfiguration({
        configType: 'run',
        name: instances[0].name,
      });
      const url = runTimeConfig?.spec.selfConfiguration.url;
      return `${url}/apis/zenko.io/v1alpha2/namespaces/zenko/zenkos/artesca-data`;
    }
  };
  return {
    queryKey: ['zenkoCR'],
    queryFn: async () => {
      return fetch(getURL(instances), {
        method: 'GET',
        headers: { authorization: `Bearer ${await getToken()}` },
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        return await res.json();
      });
    },
  };
};

export const useK8sSecretQueries = (secretNames: string[]) => {
  const { useAuth, useConfigRetriever } = useShellHooks();
  const { getToken } = useAuth();
  const { retrieveConfiguration } = useConfigRetriever();
  const instances = useDeployedMetalk8sInstances();

  const getURL = useMemo(() => {
    if (instances.length) {
      const runTimeConfig = retrieveConfiguration({
        configType: 'run',
        name: instances[0].name,
      });
      const url = runTimeConfig?.spec.selfConfiguration.url;
      return (secretName: string) => (url ? `${url}/api/v1/namespaces/zenko/secrets/${secretName}` : null);
    }
    return () => null;
  }, [instances, retrieveConfiguration]);

  const queryConfig = useMemo(
    () => ({
      queryKey: ['secret', secretNames],
      queryFn: async () => {
        return Promise.all(
          secretNames.map(async (secretName) => {
            const url = getURL(secretName);
            if (!url) {
              throw new Error('Unable to retrieve Kubernetes API URL');
            }

            const token = await getToken();
            if (!token) {
              throw new Error('Authentication token not available');
            }
            const response = await fetch(url, {
              method: 'GET',
              headers: { authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
              throw new Error(`Failed to fetch secret: ${response.statusText}`);
            }

            return response.json();
          }),
        );
      },
      enabled: !!secretNames.length && instances.length > 0,
    }),
    [getURL, getToken, instances.length, secretNames],
  );

  return useQuery(queryConfig);
};
