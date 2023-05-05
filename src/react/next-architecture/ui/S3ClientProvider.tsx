import { createContext, PropsWithChildren, useContext } from 'react';
import { S3 } from 'aws-sdk';
import { useQuery } from 'react-query';
import STSClient from '../../../js/STSClient';
import { useConfig } from './ConfigProvider';
import { useDataServiceRole } from '../../DataServiceRoleProvider';
import { useAuth } from './AuthProvider';
import { notFalsyTypeGuard } from '../../../types/typeGuards';

const S3ClientContext = createContext<S3 | null>(null);

export const useS3Client = () => {
  const s3client = useContext(S3ClientContext);
  if (!s3client) {
    throw new Error('Cannot use useS3Client outside of S3ClientProvider');
  }

  return s3client;
};

export const S3ClientProvider = ({
  configuration,
  children,
}: PropsWithChildren<{
  configuration: S3.Types.ClientConfiguration;
}>) => {
  const s3Client = new S3(configuration);
  return (
    <S3ClientContext.Provider value={s3Client}>
      {children}
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
