import { useShellHooks } from '@scality/module-federation';
import { useMutation } from 'react-query';
import type { LocationV1 } from '../../../js/managementClient/api';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import { useManagementClient } from '../../ManagementProvider';
import { useInstanceId } from '../../next-architecture/ui/AuthProvider';

/**
 * Creates a location in the configuration overlay. A 422 (validation)
 * response is surfaced as the parsed problem body so callers can render
 * the server's reason; other failures propagate as-is.
 */
export const useCreateLocationMutation = () => {
  const managementClient = useManagementClient();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const instanceId = useInstanceId();
  return useMutation({
    mutationFn: async (location: LocationV1) => {
      const client = notFalsyTypeGuard(managementClient);
      client.setToken(await getToken());
      return client.createConfigurationOverlayLocation(location, instanceId).catch(async (error) => {
        if (error.status === 422) {
          throw await error.json();
        }
      });
    },
  });
};
