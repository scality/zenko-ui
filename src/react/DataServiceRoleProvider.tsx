import { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router';
import { regexArn, useAccounts } from './utils/hooks';
import { getRoleArnStored, setRoleArnStored } from './utils/localStorage';

export const _DataServiceRoleContext = createContext<null | {
  role: { roleArn: string; roleName: string };
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

export const useCurrentAccount = () => {
  const { accountName } = useParams<{ accountName: string }>();
  const storedRoleArn = getRoleArnStored();
  const accountId = storedRoleArn
    ? regexArn.exec(storedRoleArn).groups['account_id']
    : '';
  const accountsWithRoles = useAccounts();
  const history = useHistory();
  const account = useMemo(() => {
    return accountsWithRoles.find((account) => {
      if (accountName) return account.Name === accountName;
      else if (accountId) return account.id === accountId;
      else return true;
    });
  }, [storedRoleArn, JSON.stringify(accountsWithRoles)]);

  const selectAccountAndRoleRedirectTo = (
    pathname: string,
    accountName: string,
    roleArn: string,
  ) => {
    setRoleArnStored(roleArn);

    if (pathname.includes('/buckets')) {
      history.push(`/accounts/${accountName}/buckets`);
    } else if (pathname.includes('/workflows')) {
      history.push(`/accounts/${accountName}/workflows`);
    } else {
      history.push(`/accounts/${accountName}`);
    }
  };
  return {
    account,
    selectAccountAndRoleRedirectTo,
  };
};

const DataServiceRoleProvider = ({ children }: { children: JSX.Element }) => {
  const { accountName } = useParams<{ accountName: string }>();
  const accountsWithRoles = useAccounts();
  const storedRoleArn = getRoleArnStored();
  const role = useMemo(() => {
    if (!storedRoleArn) {
      const selectedAccount = accountsWithRoles.find(
        (account) => account.Name === accountName,
      );
      const roleArn = selectedAccount?.Roles[0].Arn;
      return {
        roleArn: roleArn,
        roleName: roleArn ? regexArn.exec(roleArn).groups['role_name'] : '',
      };
    } else {
      return {
        roleArn: storedRoleArn,
        roleName: storedRoleArn
          ? regexArn.exec(storedRoleArn).groups['role_name']
          : '',
      };
    }
  }, [storedRoleArn, accountName, JSON.stringify(accountsWithRoles)]);

  return (
    <_DataServiceRoleContext.Provider
      value={{
        role,
      }}
    >
      {children}
    </_DataServiceRoleContext.Provider>
  );
};

export default DataServiceRoleProvider;
