import { DataBrowserProvider, type S3BrowserConfig, type S3Credentials } from '@scality/data-browser-library';
import { useShellHooks } from '@scality/module-federation';
import type { AWSError, STS } from 'aws-sdk';
import type { PromiseResult } from 'aws-sdk/lib/request';
import { createContext, type JSX, useContext, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { useMutation } from 'react-query';
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
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        enabled: !!roleArn,
      };
    },
  };
};

const useS3ConfigFromAssumeRoleResult = () => {
  const { zenkoEndpoint, features, s3InternalFQDN } = useConfig();
  const endpoint = genClientEndpoint(zenkoEndpoint);

  return {
    getS3Config: (
      assumeRoleResult: PromiseResult<STS.AssumeRoleWithWebIdentityResponse, AWSError> | undefined,
      cacheKey?: string,
    ): S3Config => ({
      endpoint,
      region: DEFAULT_REGION,
      forcePathStyle: true,
      features: [...features, 'metadatasearch'],
      cacheKey,
      proxy: {
        enabled: true,
        endpoint: zenkoEndpoint,
        target: s3InternalFQDN,
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
  const accountId = roleArn ? regexArn.exec(roleArn)?.groups?.['account_id'] : '';
  const { accounts } = useAccounts(noopBasedEventDispatcher);

  const account = useMemo(() => {
    return accounts.find((account) => {
      if (accountName) return account.Name === accountName;
      else if (accountId) return account.id === accountId;
      else return true;
    });
  }, [accountId, JSON.stringify(accounts), accountName]);

  return {
    account,
  };
};

export const useS3Config = (): S3Config | undefined => {
  const assumedRole = useAssumedRole();
  const { roleArn } = useDataServiceRole();
  const { getS3Config } = useS3ConfigFromAssumeRoleResult();
  return useMemo(() => {
    if (!assumedRole) return undefined;
    return getS3Config(assumedRole, roleArn);
  }, [assumedRole, getS3Config, roleArn]);
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

  const { iamInternalFQDN, s3InternalFQDN, zenkoEndpoint, iamEndpoint } = useConfig();

  useEffect(() => {
    initializeAWSSigner({
      iamInternalFQDN,
      s3InternalFQDN,
      zenkoEndpoint,
      iamEndpoint,
    });
  }, [iamInternalFQDN, s3InternalFQDN, zenkoEndpoint, iamEndpoint]);

  const { getQuery } = useAssumeRoleQuery();
  const [assumedRole, setAssumedRole] = useState<PromiseResult<STS.AssumeRoleWithWebIdentityResponse, AWSError>>();
  const assumeRoleMutation = useMutation({
    mutationFn: (roleArn: string) => getQuery(roleArn).queryFn(),
    onSuccess: (data) => {
      setAssumedRole(data);
    },
  });

  const { useAuth } = useShellHooks();
  const { userData } = useAuth();

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
  }, [accounts.length, accountName, role.roleArn]);

  useEffect(() => {
    if (role.roleArn) {
      assumeRoleMutation.mutate(role.roleArn);
    }
  }, [role.roleArn, userData?.token]);

  const { getS3Config } = useS3ConfigFromAssumeRoleResult();

  const s3Config = useMemo(() => getS3Config(assumedRole, role.roleArn), [assumedRole, getS3Config, role.roleArn]);

  const credentials: S3Credentials = useMemo(
    () => ({
      accessKeyId: s3Config.credentials.accessKeyId,
      secretAccessKey: s3Config.credentials.secretAccessKey,
      sessionToken: s3Config.credentials.sessionToken,
    }),
    [s3Config.credentials],
  );

  const getS3ConfigFn = useMemo(() => () => s3Config, [s3Config]);

  const setRole = (role: { roleArn: string }) => {
    setRoleArnStored(role.roleArn);
    setRoleState(role);
    if (role.roleArn) {
      assumeRoleMutation.mutate(role.roleArn, {});
    }
  };

  const setRolePromise = async (role: { roleArn: string }): Promise<S3Config> => {
    if (!role.roleArn) {
      return Promise.reject('Invalid role arn');
    }
    return getQuery(role.roleArn)
      .queryFn()
      .then((data) => {
        // Use flushSync to force synchronous state updates
        flushSync(() => {
          setAssumedRole(data);
          setRoleArnStored(role.roleArn);
          setRoleState(role);
        });
        return getS3Config(data, role.roleArn);
      });
  };

  if (role.roleArn && !assumedRole) {
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

export { useAssumeRoleQuery, useS3ConfigFromAssumeRoleResult };
