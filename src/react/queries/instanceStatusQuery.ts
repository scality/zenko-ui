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
    staleTime: 30_000, // 30 seconds - similar to previous Redux 30s polling
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled,
  });
};

/**
 * Hook to get bucket list from instance status.
 * Used to check if a location has associated buckets (for deletion validation).
 */
export const useBucketList = () => {
  const { data, status, isFetching } = useInstanceStatusQuery();
  const bucketList = data?.metrics?.['item-counts']?.bucketList || [];
  return { bucketList, status, isFetching };
};

/**
 * Hook to get instance capabilities.
 * Used to determine available location types.
 */
export const useCapabilities = () => {
  const { data, status } = useInstanceStatusQuery();
  const capabilities = data?.state?.capabilities as Capabilities | undefined;
  return { capabilities, status };
};

