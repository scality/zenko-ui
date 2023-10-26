import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { AWSError, S3, STS } from 'aws-sdk';
import STSClient from '../../../js/STSClient';
import { useConfig } from './ConfigProvider';
import { useAccessToken, useAuth } from './AuthProvider';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import ZenkoClient from '../../../js/ZenkoClient';
import { useDispatch } from 'react-redux';
import IAMClient from '../../../js/IAMClient';
import { _IAMContext } from '../../IAMProvider';
import { PromiseResult } from 'aws-sdk/lib/request';
import { genClientEndpoint } from '../../utils';

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
  const { iamEndpoint, iamInternalFQDN, s3InternalFQDN, basePath } =
    useConfig();
  const { s3Client, zenkoClient, iamClient } = useMemo(() => {
    const s3Config = {
      ...configuration,
      endpoint: genClientEndpoint(configuration.endpoint as string),
    };
    const s3Client = new S3(s3Config);
    const zenkoClient = new ZenkoClient(
      s3Config.endpoint,
      iamInternalFQDN,
      s3InternalFQDN,
      process.env.NODE_ENV === 'development' ? '' : basePath,
    );
    const iamClient = new IAMClient(iamEndpoint);

    if (
      configuration.credentials?.accessKeyId &&
      configuration.credentials?.secretAccessKey &&
      configuration.credentials?.sessionToken
    ) {
      zenkoClient.login({
        accessKey: configuration.credentials.accessKeyId,
        secretKey: configuration.credentials.secretAccessKey,
        sessionToken: configuration.credentials.sessionToken,
      });

      iamClient.login({
        accessKey: configuration.credentials.accessKeyId,
        secretKey: configuration.credentials.secretAccessKey,
        sessionToken: configuration.credentials.sessionToken,
      });

      dispatch({
        type: 'SET_ZENKO_CLIENT',
        zenkoClient,
      });
    }

    return { s3Client, zenkoClient, iamClient };
  }, [configuration, dispatch]);

  return (
    <S3ClientContext.Provider value={s3Client}>
      <ZenkoClientContext.Provider value={zenkoClient}>
        <_IAMContext.Provider value={{ iamClient }}>
          {children}
        </_IAMContext.Provider>
      </ZenkoClientContext.Provider>
    </S3ClientContext.Provider>
  );
};

export const useAssumeRoleQuery = () => {
  const { stsEndpoint } = useConfig();
  const token = useAccessToken();
  const user = useAuth();
  const roleSessionName = `ui-${user.userData?.id}`;
  const stsClient = new STSClient({ endpoint: stsEndpoint });
  const queryKey = ['s3AssumeRoleClient', roleSessionName, token];

  return {
    queryKey,
    getQuery: (roleArn: string) => ({
      queryKey,
      queryFn: () =>
        stsClient.assumeRoleWithWebIdentity({
          idToken: notFalsyTypeGuard(token),
          roleArn: roleArn,
          RoleSessionName: roleSessionName,
        }),

      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: !!token && !!roleArn,
    }),
  };
};

export const useS3ConfigFromAssumeRoleResult = (): {
  getS3Config: (
    assumeRoleResult:
      | PromiseResult<STS.AssumeRoleWithWebIdentityResponse, AWSError>
      | undefined,
  ) => S3.Types.ClientConfiguration;
} => {
  const { zenkoEndpoint } = useConfig();
  return {
    getS3Config: (assumeRoleResult) => ({
      endpoint: zenkoEndpoint,
      s3ForcePathStyle: true,
      credentials: {
        accessKeyId: assumeRoleResult?.Credentials?.AccessKeyId || '',
        secretAccessKey: assumeRoleResult?.Credentials?.SecretAccessKey || '',
        sessionToken: assumeRoleResult?.Credentials?.SessionToken || '',
      },
    }),
  };
};

export const _S3ConfigSetterContext = createContext<
  ((config: S3.Types.ClientConfiguration) => void) | null
>(null);

export const useSetS3Config = () => {
  const setS3Config = useContext(_S3ConfigSetterContext);
  if (!setS3Config) {
    throw new Error('Cannot use useSetS3Config outside of S3ClientProvider');
  }

  return setS3Config;
};
