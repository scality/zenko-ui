import { createContext, useContext, useMemo, useState } from 'react';
import { useLocation, useParams, useRouteMatch } from 'react-router-dom';
import { noopBasedEventDispatcher, regexArn, useAccounts } from './utils/hooks';
import {
  getRoleArnStored,
  removeRoleArnStored,
  setRoleArnStored,
} from './utils/localStorage';
import { useMutation, useQuery } from 'react-query';
import {
  S3ClientProvider,
  useAssumeRoleQuery,
  useS3ConfigFromAssumeRoleResult,
} from './next-architecture/ui/S3ClientProvider';
import Loader from './ui-elements/Loader';

export const _DataServiceRoleContext = createContext<null | {
  role: { roleArn: string };
  setRole: (role: { roleArn: string }) => void;
}>(null);

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

export const useCurrentAccount = () => {
  const { accountName } = useParams<{
    accountName: string;
  }>();
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

const DataServiceRoleProvider = ({ children }: { children: JSX.Element }) => {
  const [role, setRoleState] = useState<{ roleArn: string }>({
    roleArn: '',
  });

  const { accounts } = useAccounts(noopBasedEventDispatcher); //TODO: use a real event dispatcher

  // invalide the stored ARN if it's not in the list accountsWithRoles
  useMemo(() => {
    const storedRole = getRoleArnStored();
    if (!role.roleArn && storedRole && accounts.length) {
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
  }, [role.roleArn, JSON.stringify(accounts)]);

  const { getQuery } = useAssumeRoleQuery();
  const assumeRoleMutation = useMutation({
    mutationFn: (roleArn: string) => getQuery(roleArn).queryFn(),
  });

  const { getS3Config } = useS3ConfigFromAssumeRoleResult();

  const setRole = (role: { roleArn: string }) => {
    setRoleArnStored(role.roleArn);
    setRoleState(role);
    assumeRoleMutation.mutate(role.roleArn);
  };

  const { data: assumeRoleResult, status } = useQuery(getQuery(role.roleArn));

  if (status === 'idle') {
    return <Loader>jb</Loader>;
  }

  return (
    <S3ClientProvider
      configuration={
        assumeRoleMutation.data
          ? getS3Config(assumeRoleMutation.data)
          : getS3Config(assumeRoleResult)
      }
    >
      <_DataServiceRoleContext.Provider
        value={{
          role,
          setRole,
        }}
      >
        {children}
      </_DataServiceRoleContext.Provider>
    </S3ClientProvider>
  );
};

export default DataServiceRoleProvider;
