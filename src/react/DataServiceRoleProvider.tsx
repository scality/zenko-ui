import { createContext, useContext, useMemo, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { noopBasedEventDispatcher, regexArn, useAccounts } from './utils/hooks';
import { getRoleArnStored, setRoleArnStored } from './utils/localStorage';
import { useMutation } from 'react-query';
import {
  S3ClientProvider,
  S3ClientWithoutReduxProvider,
  useAssumeRoleQuery,
  useS3ConfigFromAssumeRoleResult,
} from './next-architecture/ui/S3ClientProvider';
import Loader from './ui-elements/Loader';
import { useAuth } from './next-architecture/ui/AuthProvider';
import { PromiseResult } from 'aws-sdk/lib/request';
import { AWSError, STS } from 'aws-sdk';

export const _DataServiceRoleContext = createContext<null | {
  role: { roleArn: string };
  setRole: (role: { roleArn: string }) => void;
  setRolePromise: (role: { roleArn: string }) => Promise<void>;
  assumedRole:
    | PromiseResult<STS.AssumeRoleWithWebIdentityResponse, AWSError>
    | undefined;
}>(null);

export const useAssumedRole = () => {
  const DataServiceCtxt = useContext(_DataServiceRoleContext);

  if (!DataServiceCtxt) {
    throw new Error(
      'The useAssumedRole hook can only be used within DataServiceRoleProvider.',
    );
  }

  return DataServiceCtxt.assumedRole;
};

export const useDataServiceRole = () => {
  const DataServiceCtxt = useContext(_DataServiceRoleContext);

  if (!DataServiceCtxt) {
    throw new Error(
      'The useDataServiceRole hook can only be used within DataServiceRoleProvider.',
    );
  }

  return DataServiceCtxt.role;
};

export const useSetAssumedRole = () => {
  const DataServiceCtxt = useContext(_DataServiceRoleContext);

  if (!DataServiceCtxt) {
    throw new Error(
      'The useSetAssumedRole hook can only be used within DataServiceRoleProvider.',
    );
  }

  return DataServiceCtxt.setRole;
};

export const useSetAssumedRolePromise = () => {
  const DataServiceCtxt = useContext(_DataServiceRoleContext);

  if (!DataServiceCtxt) {
    throw new Error(
      'The useSetAssumedRolePromise hook can only be used within DataServiceRoleProvider.',
    );
  }

  return DataServiceCtxt.setRolePromise;
};

export const useCurrentAccount = () => {
  const match = useRouteMatch<{
    accountName: string;
  }>('/accounts/:accountName');
  const accountName = match?.params?.accountName;
  const { roleArn } = useDataServiceRole();
  const accountId = roleArn
    ? regexArn.exec(roleArn)?.groups?.['account_id']
    : '';
  const { accounts } = useAccounts(noopBasedEventDispatcher); //TODO: use a real event dispatcher

  const account = useMemo(() => {
    return accounts.find((account) => {
      if (accountName) return account.Name === accountName;
      else if (accountId) return account.id === accountId;
      else return true;
    });
  }, [accountId, JSON.stringify(accounts)]);

  return {
    account,
  };
};

const DataServiceRoleProvider = ({
  children,
  /**
   * DoNotChangePropsWithRedux is a static props.
   * When set, it must not be changed, otherwise it will break the hook rules.
   * To be removed when we remove redux.
   */
  DoNotChangePropsWithRedux = true,
}: {
  children: JSX.Element;
  DoNotChangePropsWithRedux?: boolean;
}) => {
  const [role, setRoleState] = useState<{ roleArn: string }>({
    roleArn: '',
  });
  const { accounts } = useAccounts(noopBasedEventDispatcher); //TODO: use a real event dispatcher
  const match = useRouteMatch<{
    accountName: string;
  }>('/accounts/:accountName');
  const accountName = match?.params.accountName;

  const { getQuery } = useAssumeRoleQuery();
  const [assumedRole, setAssumedRole] =
    useState<PromiseResult<STS.AssumeRoleWithWebIdentityResponse, AWSError>>();
  const assumeRoleMutation = useMutation({
    mutationFn: (roleArn: string) => getQuery(roleArn).queryFn(),
    onSuccess: (data) => {
      setAssumedRole(data);
    },
  });

  const { userData } = useAuth();

  // invalide the stored ARN if it's not in the list accountsWithRoles
  useMemo(() => {
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

    if (role.roleArn) {
      assumeRoleMutation.mutate(role.roleArn);
    }
  }, [role.roleArn, JSON.stringify(accounts), userData?.token]);

  const { getS3Config } = useS3ConfigFromAssumeRoleResult();

  const setRole = (role: { roleArn: string }) => {
    setRoleArnStored(role.roleArn);
    setRoleState(role);
    if (role.roleArn) {
      assumeRoleMutation.mutate(role.roleArn, {});
    }
  };

  const setRolePromise = async (role: { roleArn: string }) => {
    if (!role.roleArn) {
      return Promise.reject('Invalid role arn');
    }
    return getQuery(role.roleArn)
      .queryFn()
      .then((data) => {
        setAssumedRole(data);
        setRoleArnStored(role.roleArn);
        setRoleState(role);
      });
  };

  if (role.roleArn && !assumedRole) {
    //@ts-expect-error fix this when you are working on it
    return <Loader>Loading...</Loader>;
  }

  if (DoNotChangePropsWithRedux) {
    return (
      <S3ClientProvider configuration={getS3Config(assumedRole)}>
        <_DataServiceRoleContext.Provider
          value={{
            role,
            setRole,
            setRolePromise,
            assumedRole,
          }}
        >
          {children}
        </_DataServiceRoleContext.Provider>
      </S3ClientProvider>
    );
  }

  return (
    <S3ClientWithoutReduxProvider configuration={getS3Config(assumedRole)}>
      <_DataServiceRoleContext.Provider
        value={{
          role,
          setRole,
          setRolePromise,
          assumedRole,
        }}
      >
        {children}
      </_DataServiceRoleContext.Provider>
    </S3ClientWithoutReduxProvider>
  );
};

export default DataServiceRoleProvider;
