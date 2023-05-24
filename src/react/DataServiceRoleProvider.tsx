import { createContext, useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  const { accountName } = useParams<{ accountName: string }>();
  const storedRoleArn = getRoleArnStored();
  const accountId = storedRoleArn
    ? regexArn.exec(storedRoleArn)?.groups?.['account_id']
    : '';
  const { accounts } = useAccounts(noopBasedEventDispatcher); //TODO: use a real event dispatcher

  // invalide the stored ARN if it's not in the list accountsWithRoles
  useMemo(() => {
    const isStoredArnValide = accounts.find((account) => {
      return account.Roles.find((role) => {
        return role.Arn === storedRoleArn;
      });
    });
    if (!isStoredArnValide && storedRoleArn && accounts.length) {
      removeRoleArnStored();
    }
  }, [storedRoleArn, JSON.stringify(accounts)]);

  const account = useMemo(() => {
    return accounts.find((account) => {
      if (accountName) return account.Name === accountName;
      else if (accountId) return account.id === accountId;
      else return true;
    });
  }, [storedRoleArn, JSON.stringify(accounts)]);

  return {
    account,
  };
};

const DataServiceRoleProvider = ({ children }: { children: JSX.Element }) => {
  const [role, setRoleState] = useState<{ roleArn: string }>({
    roleArn: getRoleArnStored(),
  });

  const { account } = useCurrentAccount();
  const storedAccountID = regexArn.exec(role.roleArn)?.groups?.['account_id'];

  const roleArn = useMemo(() => {
    if (!role.roleArn || account?.id !== storedAccountID) {
      // If the account is not the same as the one stored in the localstorage or it's empty, asssume the first Role in the list.
      const defaultAssumedRoleArn = account?.Roles[0].Arn;
      if (defaultAssumedRoleArn) setRoleArnStored(defaultAssumedRoleArn);
      return defaultAssumedRoleArn || '';
    } else {
      return role.roleArn;
    }
  }, [role.roleArn, JSON.stringify(account)]);

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

  const { data: assumeRoleResult } = useQuery(getQuery(roleArn));

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
          role: { roleArn },
          setRole,
        }}
      >
        {children}
      </_DataServiceRoleContext.Provider>
    </S3ClientProvider>
  );
};

export default DataServiceRoleProvider;
