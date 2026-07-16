import { useShellHooks } from '@scality/module-federation';
import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { SetupFailedError, startSetup } from '../api/crrConfiguratorClient';
import type { SetupEvent, SetupResult, StartSetupBody } from '../api/types';

const EVENTS_QUERY_KEY = ['crr-configurator', 'setup', 'events'] as const;

export const useCRRConfigurationSetupMutation = () => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  // abortRef is only released via cancel() — deliberately no unmount
  // cleanup. Aborting mid-flight cancels the request context on the
  // configurator side, which strands the destination cluster with
  // partial state (create-access-key is not idempotent). Passive
  // unmount lets the setup complete server-side; cancel() is the
  // intentional abort gesture.
  const abortRef = useRef<AbortController | null>(null);

  const { data: events = [] } = useQuery<SetupEvent[]>(EVENTS_QUERY_KEY, {
    enabled: false,
    initialData: [],
    staleTime: Number.POSITIVE_INFINITY,
  });

  const mutation = useMutation<SetupResult, Error, StartSetupBody>({
    mutationFn: async (body) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      queryClient.setQueryData<SetupEvent[]>(EVENTS_QUERY_KEY, []);
      const token = await getToken();
      for await (const event of startSetup(body, { token, signal: controller.signal })) {
        queryClient.setQueryData<SetupEvent[]>(EVENTS_QUERY_KEY, (prev = []) => [...prev, event]);
        if (event.event === 'setup.completed') return event.result;
        if (event.event === 'setup.failed') throw new SetupFailedError(event.error);
      }
      throw new Error('replication-setups stream ended without a terminal event');
    },
  });

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    queryClient.setQueryData<SetupEvent[]>(EVENTS_QUERY_KEY, []);
    mutation.reset();
  };

  return { ...mutation, events, cancel };
};
