import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { useManagementClient } from '../ManagementProvider';
import { useInstanceId } from '../next-architecture/ui/AuthProvider';
import { useShellHooks } from '@scality/module-federation';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useErrorHandler } from '../ErrorProvider';
import { ApiError } from '../../types/actions';
import { InlineResponse200 } from '../../js/managementClient/api';
import { Capabilities } from '../../types/stats';

export const INSTANCE_STATUS_QUERY_KEY = 'instanceStatus';

type InstanceStatusQueryOptions = {
  refetchInterval?: number | false;
  enabled?: boolean;
  onError?: (error: ApiError) => void;
};

/**
 * Base hook for fetching instance status.
 * Shared by all components that need instance status data.
 */
export const useInstanceStatusQuery = (options?: InstanceStatusQueryOptions) => {
  const managementClient = useManagementClient();
  const instanceId = useInstanceId();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const { handleClientError } = useErrorHandler();

  return useQuery<InlineResponse200, ApiError>({
    queryKey: [INSTANCE_STATUS_QUERY_KEY, instanceId],
    queryFn: async () => {
      const client = notFalsyTypeGuard(managementClient);
      client.setToken(await getToken());
      return client.getLatestInstanceStatus(instanceId);
    },
    onError: options?.onError ?? handleClientError,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // When polling is enabled (refetchInterval set), use staleTime: 0 to force fresh data
    // Otherwise use 30s staleTime for normal caching
    staleTime: options?.refetchInterval ? 0 : 30_000,
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled,
  });
};

/**
 * Hook to get bucket list from instance status.
 * Uses useMemo to stabilize reference across re-renders.
 */
export const useBucketList = () => {
  const { data, status, isFetching } = useInstanceStatusQuery();
  const rawBucketList = data?.metrics?.['item-counts']?.bucketList;

  const bucketList = useMemo(() => {
    return rawBucketList || [];
  }, [JSON.stringify(rawBucketList)]);

  return { bucketList, status, isFetching };
};

/**
 * Hook to get instance capabilities.
 * Uses useMemo to stabilize reference across re-renders.
 */
export const useCapabilities = () => {
  const { data, status } = useInstanceStatusQuery();
  const rawCapabilities = data?.state?.capabilities;

  const capabilities = useMemo(() => {
    return rawCapabilities as Capabilities | undefined;
  }, [JSON.stringify(rawCapabilities)]);

  return { capabilities, status };
};
