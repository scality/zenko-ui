import type { AwsCredentialIdentity } from '@aws-sdk/types';
import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';
import IAMClient from '../js/IAMClient';
import { useConfig } from './next-architecture/ui/ConfigProvider';

export const _IAMContext = createContext<null | {
  iamClient: IAMClient;
}>(null);

export const useIAMClient = () => {
  const IAMCtxt = useContext(_IAMContext);

  if (!IAMCtxt) {
    throw new Error('The useIAMClient hook can only be used within IAMProvider.');
  }

  return IAMCtxt.iamClient;
};

type IAMProviderProps = PropsWithChildren<{
  credentials?: AwsCredentialIdentity;
}>;

export const IAMProvider = ({ children, credentials }: IAMProviderProps) => {
  const { iamEndpoint } = useConfig();

  const iamClient = useMemo(() => {
    const client = new IAMClient(iamEndpoint);

    if (credentials?.accessKeyId && credentials?.secretAccessKey) {
      client.login(credentials);
    }

    return client;
  }, [iamEndpoint, credentials]);

  return <_IAMContext.Provider value={{ iamClient }}>{children}</_IAMContext.Provider>;
};
