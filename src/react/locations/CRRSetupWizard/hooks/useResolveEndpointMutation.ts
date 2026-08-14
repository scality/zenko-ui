import { useShellHooks } from '@scality/module-federation';
import { useMutation } from 'react-query';
import { resolve } from '../api/crrConfiguratorClient';
import type { ResolveRequestBody, ResolveResponse } from '../api/types';

export const useResolveEndpointMutation = () => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  return useMutation<ResolveResponse, Error, ResolveRequestBody>({
    mutationFn: async (body) => resolve(body, { token: await getToken() }),
  });
};
