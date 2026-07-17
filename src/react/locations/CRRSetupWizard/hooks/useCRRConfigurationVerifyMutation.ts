import { useShellHooks } from '@scality/module-federation';
import { useMutation } from 'react-query';
import { verify } from '../api/crrConfiguratorClient';
import type { VerifyRequestBody, VerifyResponse } from '../api/types';

export const useCRRConfigurationVerifyMutation = () => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  return useMutation<VerifyResponse, Error, VerifyRequestBody>({
    mutationFn: async (body) => verify(body, { token: await getToken() }),
  });
};
