import { useShellHooks } from '@scality/module-federation';
import { useMutation } from 'react-query';
import { createConnection } from '../api/crrConfiguratorClient';
import type { ConnectionRequestBody, ConnectionResponse } from '../api/types';

export const useDestinationConnectionMutation = () => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  return useMutation<ConnectionResponse, Error, ConnectionRequestBody>({
    mutationFn: async (body) => createConnection(body, { token: await getToken() }),
  });
};
