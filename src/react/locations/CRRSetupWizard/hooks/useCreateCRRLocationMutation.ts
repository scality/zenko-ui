import { useShellHooks } from '@scality/module-federation';
import { useEffect, useRef } from 'react';
import { useMutation } from 'react-query';
import type { LocationV1 } from '../../../../js/managementClient/api';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { useManagementClient } from '../../../ManagementProvider';
import { useInstanceId } from '../../../next-architecture/ui/AuthProvider';
import { useCreateLocationMutation } from '../../hooks/useCreateLocationMutation';

// Bounded best-effort window for the running configuration to catch up before
// the following replication-rule step runs. Bounded by wall-clock time, not a
// poll count, because each status poll is itself a round-trip to the instance.
const RECONCILE_WAIT_MS = 5 * 60_000;
const POLL_INTERVAL_MS = 2_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isAlreadyExists = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : JSON.stringify(error ?? '');
  return /already\s?exists/i.test(message);
};

/**
 * Creates the CRR location. Success is decoupled from reconciliation: the step
 * succeeds as soon as the location is written to the overlay (the same source
 * the Locations list reads from), so it no longer lags behind — nor reports a
 * false failure while — the location already exists.
 *
 * `waitForReconciliation` adds a bounded best-effort wait for
 * `runningConfigurationVersion` to advance, used only when a replication rule
 * follows: that step references the location by name through cloudserver, which
 * accepts it only once the overlay has reconciled. The wait never fails the
 * step — on timeout it resolves, leaving the replication-rule step to retry.
 */
export const useCreateCRRLocationMutation = ({ waitForReconciliation }: { waitForReconciliation: boolean }) => {
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
      const referenceVersion = waitForReconciliation ? await runningConfigurationVersion() : 0;
      try {
        await createLocation.mutateAsync(location);
      } catch (error) {
        // On a retry the location already exists — treat as created, keep going.
        if (!isAlreadyExists(error)) throw error;
      }
      // The location is now in the overlay, so the create is done. Only wait when
      // a replication rule follows, and only best-effort within a bounded window.
      if (!waitForReconciliation) return;
      const deadline = Date.now() + RECONCILE_WAIT_MS;
      while (Date.now() < deadline) {
        if (cancelledRef.current) return;
        if ((await runningConfigurationVersion()) > referenceVersion) return;
        await delay(POLL_INTERVAL_MS);
      }
    },
  });
};
