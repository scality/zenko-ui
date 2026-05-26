import { DataBrowserProvider, type S3BrowserConfig, type S3Credentials } from '@scality/data-browser-library';
import { useShellHooks } from '@scality/module-federation';
import type { AWSError, STS } from 'aws-sdk';
import type { PromiseResult } from 'aws-sdk/lib/request';
import { createContext, type JSX, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router';
import { useTheme } from 'styled-components';
import STSClient from '../js/STSClient';
import { notFalsyTypeGuard } from '../types/typeGuards';
import { IAMProvider } from './IAMProvider';
import { DEFAULT_REGION } from './ISV/components/ISVSummary';
import { useConfig } from './next-architecture/ui/ConfigProvider';
import Loader from './ui-elements/Loader';
import { genClientEndpoint, initializeAWSSigner } from './utils';
import { noopBasedEventDispatcher, regexArn, useAccounts } from './utils/hooks';
import { getRoleArnStored, setRoleArnStored } from './utils/localStorage';
import { ZenkoProvider } from './ZenkoProvider';

export type S3Config = S3BrowserConfig & {
  credentials: S3Credentials;
};

// STS credentials have a 15-minute TTL. Refresh ~3 minutes early so S3/IAM
// callers always see a valid session. The 2-minute buffer below matches the
// AWS SDK v3 memoize threshold so on-demand refresh and proactive refresh
// agree on when to rotate.
const STS_REFRESH_INTERVAL_MS = 12 * 60 * 1000;
const STS_REFRESH_BUFFER_MS = 2 * 60 * 1000;
// Prevents tight retry loops against STS when refresh is failing (e.g. 403).
const STS_REFRESH_COOLDOWN_MS = 10 * 1000;

const useAssumeRoleQuery = () => {
  const { stsEndpoint } = useConfig();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const user = useAuth();
  const roleSessionName = `ui-${user.userData?.id}`;
  const stsClient = new STSClient({ endpoint: stsEndpoint });
  const queryKey = ['s3AssumeRoleClient', roleSessionName];

  return {
    queryKey,
    getQuery: (roleArn: string) => {
      return {
        queryKey,
        queryFn: async () =>
          stsClient.assumeRoleWithWebIdentity({
            idToken: notFalsyTypeGuard(await getToken()),
            roleArn: roleArn,
            RoleSessionName: roleSessionName,
          }),
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        refetchOnReconnect: false,
        staleTime: STS_REFRESH_INTERVAL_MS,
        refetchInterval: STS_REFRESH_INTERVAL_MS,
        refetchIntervalInBackground: true,
        enabled: !!roleArn,
      };
    },
  };
};

const useS3ConfigFromAssumeRoleResult = () => {
  const { zenkoEndpoint, s3InternalFQDN } = useConfig();
  const endpoint = genClientEndpoint(zenkoEndpoint);

  return {
    getS3Config: (
      assumeRoleResult: PromiseResult<STS.AssumeRoleWithWebIdentityResponse, AWSError> | undefined,
      cacheKey?: string,
    ): S3Config => ({
      endpoint,
      region: DEFAULT_REGION,
      forcePathStyle: true,
      features: ['ISV', 'metadatasearch', 'replicationV1', 'lifecycleTransition'],
      cacheKey,
      proxy: {
        enabled: true,
        endpoint: zenkoEndpoint,
        target: s3InternalFQDN,
      },
      s3Capabilities: {
        supportedNotificationEvents: [
          's3:ObjectCreated:*',
          's3:ObjectCreated:Put',
          's3:ObjectCreated:Copy',
          's3:ObjectCreated:CompleteMultipartUpload',
          's3:ObjectRemoved:*',
          's3:ObjectRemoved:Delete',
          's3:ObjectRemoved:DeleteMarkerCreated',
          's3:Replication:OperationFailedReplication',
          's3:ObjectTagging:*',
          's3:ObjectTagging:Put',
          's3:ObjectTagging:Delete',
          's3:ObjectAcl:Put',
          's3:ObjectRestore:*',
          's3:ObjectRestore:Post',
          's3:ObjectRestore:Completed',
          's3:ObjectRestore:Delete',
          's3:LifecycleTransition',
          's3:LifecycleExpiration:*',
          's3:LifecycleExpiration:DeleteMarkerCreated',
          's3:LifecycleExpiration:Delete',
        ],
      },
      credentials: {
        accessKeyId: assumeRoleResult?.Credentials?.AccessKeyId || '',
        secretAccessKey: assumeRoleResult?.Credentials?.SecretAccessKey || '',
        sessionToken: assumeRoleResult?.Credentials?.SessionToken || '',
      },
    }),
  };
};

export const _DataServiceRoleContext = createContext<null | {
  role: { roleArn: string };
  setRole: (role: { roleArn: string }) => void;
  setRolePromise: (role: { roleArn: string }) => Promise<S3Config>;
  assumedRole: PromiseResult<STS.AssumeRoleWithWebIdentityResponse, AWSError> | undefined;
}>(null);

export const useAssumedRole = () => {
  const DataServiceCtxt = useContext(_DataServiceRoleContext);

  if (!DataServiceCtxt) {
    throw new Error('The useAssumedRole hook can only be used within DataServiceRoleProvider.');
  }

  return DataServiceCtxt.assumedRole;
};

export const useDataServiceRole = () => {
  const DataServiceCtxt = useContext(_DataServiceRoleContext);

  if (!DataServiceCtxt) {
    throw new Error('The useDataServiceRole hook can only be used within DataServiceRoleProvider.');
  }

  return DataServiceCtxt.role;
};

export const useSetAssumedRole = () => {
  const DataServiceCtxt = useContext(_DataServiceRoleContext);

  if (!DataServiceCtxt) {
    throw new Error('The useSetAssumedRole hook can only be used within DataServiceRoleProvider.');
  }

  return DataServiceCtxt.setRole;
};

export const useSetAssumedRolePromise = () => {
  const DataServiceCtxt = useContext(_DataServiceRoleContext);

  if (!DataServiceCtxt) {
    throw new Error('The useSetAssumedRolePromise hook can only be used within DataServiceRoleProvider.');
  }

  return DataServiceCtxt.setRolePromise;
};

export const useCurrentAccount = () => {
  const params = useParams();
  const accountName = params?.accountName;
  const { roleArn } = useDataServiceRole();
  const accountId = roleArn ? regexArn.exec(roleArn)?.groups?.account_id : '';
  const { accounts } = useAccounts(noopBasedEventDispatcher);

  const account = useMemo(() => {
    return accounts.find((account) => {
      if (accountName) return account.Name === accountName;
      else if (accountId) return account.id === accountId;
      else return true;
    });
  }, [accountId, accounts, accountName]);

  return {
    account,
  };
};

const DataServiceRoleProvider = ({
  children,
  inlineLoader = false,
}: {
  children: JSX.Element;
  inlineLoader?: boolean;
}) => {
  const [role, setRoleState] = useState<{ roleArn: string }>({
    roleArn: '',
  });
  const { accounts } = useAccounts(noopBasedEventDispatcher);
  const params = useParams();
  const accountName = params?.accountName;
  const theme = useTheme();

  const { iamInternalFQDN, s3InternalFQDN, zenkoEndpoint, iamEndpoint, stsEndpoint } = useConfig();

  useEffect(() => {
    initializeAWSSigner({
      iamInternalFQDN,
      s3InternalFQDN,
      zenkoEndpoint,
      iamEndpoint,
    });
  }, [iamInternalFQDN, s3InternalFQDN, zenkoEndpoint, iamEndpoint]);

  const { useAuth } = useShellHooks();
  const { getToken, userData } = useAuth();
  const roleSessionName = `ui-${userData?.id}`;
  const stsClient = useMemo(() => new STSClient({ endpoint: stsEndpoint }), [stsEndpoint]);
  const queryClient = useQueryClient();

  const assumeRoleQuery = useQuery(
    ['assumeRole', role.roleArn],
    async () =>
      stsClient.assumeRoleWithWebIdentity({
        idToken: notFalsyTypeGuard(await getToken()),
        roleArn: role.roleArn,
        RoleSessionName: roleSessionName,
      }),
    {
      enabled: !!role.roleArn,
      refetchOnWindowFocus: true,
      refetchOnMount: 'always',
      keepPreviousData: true,
      staleTime: STS_REFRESH_INTERVAL_MS,
      refetchInterval: STS_REFRESH_INTERVAL_MS,
      refetchIntervalInBackground: true,
    },
  );

  const assumedRole = assumeRoleQuery.data;

  useEffect(() => {
    const storedRole = getRoleArnStored();
    if (accountName) {
      const account = accounts.find((account) => account.Name === accountName);
      if (account && !role.roleArn) {
        setRoleState({ roleArn: account?.Roles[0].Arn });
      }
    } else if (!role.roleArn && storedRole && accounts.length) {
      const isStoredArnValide = accounts.find((account) => {
        return account.Roles.find((r) => {
          return r.Arn === storedRole;
        });
      });
      if (isStoredArnValide) {
        setRoleState({ roleArn: storedRole });
      } else {
        setRoleState({ roleArn: accounts[0].Roles[0].Arn });
      }
    } else if (!storedRole && !role.roleArn && accounts.length) {
      setRoleState({ roleArn: accounts[0].Roles[0].Arn });
    }
  }, [accounts, accountName, role.roleArn]);

  const { getS3Config } = useS3ConfigFromAssumeRoleResult();

  const s3Config = useMemo(() => getS3Config(assumedRole, role.roleArn), [assumedRole, getS3Config, role.roleArn]);

  const credentials = s3Config.credentials;

  const s3ConfigRef = useRef(s3Config);
  s3ConfigRef.current = s3Config;

  const assumeRoleQueryRef = useRef(assumeRoleQuery);
  assumeRoleQueryRef.current = assumeRoleQuery;

  const refreshPromiseRef = useRef<Promise<S3Credentials> | null>(null);
  const refreshCooldownUntilRef = useRef<number>(0);
  const lastRefreshErrorRef = useRef<Error | null>(null);

  const credentialProvider = useCallback(async (): Promise<S3Credentials> => {
    const expiration = assumeRoleQueryRef.current.data?.Credentials?.Expiration;

    if (expiration && new Date(expiration).getTime() - Date.now() <= STS_REFRESH_BUFFER_MS) {
      // In-cooldown after a recent failure: fail fast with the last error
      // instead of hammering STS from every S3/IAM call.
      if (Date.now() < refreshCooldownUntilRef.current && lastRefreshErrorRef.current) {
        throw lastRefreshErrorRef.current;
      }
      if (!refreshPromiseRef.current) {
        refreshPromiseRef.current = assumeRoleQueryRef.current
          .refetch()
          .then((result) => {
            refreshPromiseRef.current = null;
            if (result.isError || !result.data?.Credentials) {
              throw result.error instanceof Error
                ? result.error
                : new Error(String(result.error || 'STS credential refresh failed'));
            }
            lastRefreshErrorRef.current = null;
            refreshCooldownUntilRef.current = 0;
            const exp = result.data.Credentials.Expiration;
            return {
              accessKeyId: result.data.Credentials.AccessKeyId || '',
              secretAccessKey: result.data.Credentials.SecretAccessKey || '',
              sessionToken: result.data.Credentials.SessionToken || '',
              expiration: exp ? new Date(exp) : undefined,
            };
          })
          .catch((err) => {
            refreshPromiseRef.current = null;
            const normalized = err instanceof Error ? err : new Error(String(err));
            lastRefreshErrorRef.current = normalized;
            refreshCooldownUntilRef.current = Date.now() + STS_REFRESH_COOLDOWN_MS;
            throw normalized;
          });
      }
      return await refreshPromiseRef.current;
    }

    return {
      ...(s3ConfigRef.current.credentials as S3Credentials),
      expiration: expiration ? new Date(expiration) : undefined,
    };
  }, []);

  const getS3ConfigFn = useCallback(() => {
    return {
      ...s3ConfigRef.current,
      credentials: credentialProvider,
    };
  }, [credentialProvider]);

  const setRole = (role: { roleArn: string }) => {
    setRoleArnStored(role.roleArn);
    setRoleState(role);
  };

  const setRolePromise = async (newRole: { roleArn: string }): Promise<S3Config> => {
    if (!newRole.roleArn) {
      return Promise.reject('Invalid role arn');
    }
    const data = await queryClient.fetchQuery(['assumeRole', newRole.roleArn], async () =>
      stsClient.assumeRoleWithWebIdentity({
        idToken: notFalsyTypeGuard(await getToken()),
        roleArn: newRole.roleArn,
        RoleSessionName: roleSessionName,
      }),
    );
    flushSync(() => {
      setRoleArnStored(newRole.roleArn);
      setRoleState(newRole);
    });
    return getS3Config(data, newRole.roleArn);
  };

  if (accountName && !role.roleArn) {
    return <Loader>Loading...</Loader>;
  }

  if (role.roleArn && assumeRoleQuery.isLoading) {
    //@ts-expect-error fix this when you are working on it
    return inlineLoader ? <div>loading...</div> : <Loader>Loading...</Loader>;
  }

  return (
    <_DataServiceRoleContext.Provider
      value={{
        role,
        setRole,
        setRolePromise,
        assumedRole,
      }}
    >
      <IAMProvider credentials={credentials}>
        <ZenkoProvider credentials={credentials}>
          <DataBrowserProvider getS3Config={getS3ConfigFn} theme={theme}>
            {children}
          </DataBrowserProvider>
        </ZenkoProvider>
      </IAMProvider>
    </_DataServiceRoleContext.Provider>
  );
};

export default DataServiceRoleProvider;

export { useAssumeRoleQuery };
