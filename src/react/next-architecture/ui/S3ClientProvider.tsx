import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { S3 } from 'aws-sdk';
import { useQuery } from 'react-query';
import STSClient from '../../../js/STSClient';
import { useConfig } from './ConfigProvider';
import { useDataServiceRole } from '../../DataServiceRoleProvider';
import { useAuth } from './AuthProvider';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import ZenkoClient from '../../../js/ZenkoClient';
import { useDispatch } from 'react-redux';

const S3ClientContext = createContext<S3 | null>(null);
const ZenkoClientContext = createContext<ZenkoClient | null>(null);

export const useS3Client = () => {
  const s3client = useContext(S3ClientContext);
  if (!s3client) {
    throw new Error('Cannot use useS3Client outside of S3ClientProvider');
  }

  return s3client;
};

export const useZenkoClient = () => {
  const zenkoClient = useContext(ZenkoClientContext);
  if (!zenkoClient) {
    throw new Error('Cannot use useZenkoClient outside of S3ClientProvider');
  }

  return zenkoClient;
};

export const S3ClientProvider = ({
  configuration,
  children,
}: PropsWithChildren<{
  configuration: S3.Types.ClientConfiguration;
}>) => {
  const dispatch = useDispatch();
  const { s3Client, zenkoClient } = useMemo(() => {
    const s3Client = new S3(configuration);
    const zenkoClient = new ZenkoClient(configuration.endpoint as string);

    if (
      configuration.credentials?.accessKeyId &&
      configuration.credentials?.secretAccessKey &&
      configuration.credentials?.sessionToken
    ) {
      zenkoClient.login({
        accessKey: configuration.credentials?.accessKeyId || '',
        secretKey: configuration.credentials?.secretAccessKey || '',
        sessionToken: configuration.credentials?.sessionToken || '',
      });

      dispatch({
        type: 'SET_ZENKO_CLIENT',
        zenkoClient,
      });
    }

    return { s3Client, zenkoClient };
  }, [configuration, dispatch]);

  return (
    <S3ClientContext.Provider value={s3Client}>
      <ZenkoClientContext.Provider value={zenkoClient}>
        {children}
      </ZenkoClientContext.Provider>
    </S3ClientContext.Provider>
  );
};

export const S3AssumeRoleClientProvider = ({
  children,
  configuration,
}: PropsWithChildren<{
  configuration?: Omit<
    S3.Types.ClientConfiguration,
    | 'credentials'
    | 'credentialProvider'
    | 'accessKeyId'
    | 'secretAccessKey'
    | 'sessionToken'
  >;
}>) => {
  const { stsEndpoint, zenkoEndpoint } = useConfig();
  const { roleArn } = useDataServiceRole();
  const { user } = useAuth();
  const token = user?.access_token;
  const stsClient = new STSClient({ endpoint: stsEndpoint });
  const roleSessionName = `ui-${user?.profile.sub}`;

  const { data: assumeRoleResult } = useQuery(
    ['s3AssumeRoleClient', token, roleArn, roleSessionName],
    () =>
      stsClient.assumeRoleWithWebIdentity({
        idToken: notFalsyTypeGuard(token),
        roleArn: roleArn,
        RoleSessionName: roleSessionName,
      }),
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: !!token && !!roleArn,
    },
  );

  const s3Config: S3.Types.ClientConfiguration = {
    endpoint: zenkoEndpoint,
    s3ForcePathStyle: true,
    ...configuration,
    credentials: {
      accessKeyId: assumeRoleResult?.Credentials?.AccessKeyId || '',
      secretAccessKey: assumeRoleResult?.Credentials?.SecretAccessKey || '',
      sessionToken: assumeRoleResult?.Credentials?.SessionToken || '',
    },
  };

  return (
    <S3ClientProvider configuration={s3Config}>{children}</S3ClientProvider>
  );
};
