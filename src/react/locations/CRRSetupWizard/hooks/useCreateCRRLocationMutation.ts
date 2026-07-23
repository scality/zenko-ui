import { useShellHooks } from '@scality/module-federation';
import { useEffect, useRef } from 'react';
import { useMutation } from 'react-query';
import type { LocationV1 } from '../../../../js/managementClient/api';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { useManagementClient } from '../../../ManagementProvider';
import { useInstanceId } from '../../../next-architecture/ui/AuthProvider';
import { useCreateLocationMutation } from '../../hooks/useCreateLocationMutation';

const POLL_INTERVAL_MS = 500;
const MAX_POLLS = 120; // ~60s

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isAlreadyExists = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : JSON.stringify(error ?? '');
  return /already\s?exists/i.test(message);
};

/**
 * Creates the CRR location and resolves only once it has been applied to the
 * running configuration. The subsequent replication rule references the
 * location by name (`StorageClass`), which cloudserver only accepts after the
 * overlay has reconciled — so the wizard must wait here before that step runs.
 */
export const useCreateCRRLocationMutation = () => {
  const createLocation = useCreateLocationMutation();
  const managementClient = useManagementClient();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const instanceId = useInstanceId();

  // Stop polling if the step is torn down (Exit/Cancel) so the loop can't outlive the component.
  const cancelledRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const runningConfigurationVersion = async (): Promise<number> => {
    const client = notFalsyTypeGuard(managementClient);
    client.setToken(await getToken());
    return (await client.getLatestInstanceStatus(instanceId)).state?.runningConfigurationVersion ?? 0;
  };

  return useMutation({
    mutationFn: async (location: LocationV1) => {
      const referenceVersion = await runningConfigurationVersion();
      try {
        await createLocation.mutateAsync(location);
      } catch (error) {
        // On a retry after a reconcile timeout the location already exists — keep waiting, don't re-fail.
        if (!isAlreadyExists(error)) throw error;
      }
      for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
        if (cancelledRef.current) return;
        if ((await runningConfigurationVersion()) > referenceVersion) {
          return;
        }
        await delay(POLL_INTERVAL_MS);
      }
      throw new Error('Timed out waiting for the location to be applied to the running configuration');
    },
  });
};
