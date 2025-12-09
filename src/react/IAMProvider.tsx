import { createContext, useContext, useMemo, PropsWithChildren } from 'react';
import IAMClient from '../js/IAMClient';
import { useConfig } from './next-architecture/ui/ConfigProvider';
import { S3Credentials } from '@scality/data-browser-library';

export const _IAMContext = createContext<null | {
  iamClient: IAMClient;
}>(null);

export const useIAMClient = () => {
  const IAMCtxt = useContext(_IAMContext);

  if (!IAMCtxt) {
    throw new Error(
      'The useIAMClient hook can only be used within IAMProvider.',
    );
  }

  return IAMCtxt.iamClient;
};

type IAMProviderProps = PropsWithChildren<{
  credentials?: S3Credentials;
}>;

export const IAMProvider = ({ children, credentials }: IAMProviderProps) => {
  const { iamEndpoint } = useConfig();

  const iamClient = useMemo(() => {
    const client = new IAMClient(iamEndpoint);

    if (
      credentials?.accessKeyId &&
      credentials?.secretAccessKey &&
      credentials?.sessionToken
    ) {
      client.login({
        accessKey: credentials.accessKeyId,
        secretKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      });
    }

    return client;
  }, [
    iamEndpoint,
    credentials?.accessKeyId,
    credentials?.secretAccessKey,
    credentials?.sessionToken,
  ]);

  return (
    <_IAMContext.Provider value={{ iamClient }}>
      {children}
    </_IAMContext.Provider>
  );
};
