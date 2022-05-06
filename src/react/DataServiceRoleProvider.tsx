import { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { generatePath, useHistory } from 'react-router';
import { regexArn, useAccounts } from './utils/hooks';
import { getRoleArnStored, setRoleArnStored } from './utils/localStorage';

export const _DataServiceRoleContext = createContext<null | {
  role: { roleArn: string };
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
    path: string,
    accountName: string,
    roleArn: string,
  ) => {
    setRoleArnStored(roleArn);
    history.push(
      generatePath(path, {
        accountName: accountName,
      }),
    );
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
      };
    } else {
      return {
        roleArn: storedRoleArn,
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
