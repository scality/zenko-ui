import { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router';
import { Account } from '../types/account';
import { useAccounts } from './utils/hooks';
import { getAccountIDStored, setAccountIDStored } from './utils/localStorage';

export const _DataServiceRoleContext = createContext<null | {
  roleArn: string;
}>(null);

export const useDataServiceRole = () => {
  const DataServiceCtxt = useContext(_DataServiceRoleContext);

  if (!DataServiceCtxt) {
    throw new Error(
      'The useDataServiceRole hook can only be used within DataServiceRoleProvider.',
    );
  }

  return DataServiceCtxt.roleArn;
};

export const useCurrentAccount = () => {
  const { accountName } = useParams<{ accountName: string }>();
  const storedAccoutId = getAccountIDStored();
  const accountsWithRoles = useAccounts();
  const history = useHistory();

  const account = accountsWithRoles.find((account) => {
    if (accountName) return account.Name === accountName;
    else if (storedAccoutId) return account.id === storedAccoutId;
    else return true;
  });

  const selectAccountAndRedirectTo = (pathname: string, account: Account) => {
    setAccountIDStored(account.id);

    if (pathname.includes('/buckets')) {
      history.push(`/accounts/${account.Name}/buckets`);
    } else if (pathname.includes('/workflows')) {
      history.push(`/accounts/${account.Name}/workflows`);
    } else {
      history.push(`/accounts/${account.Name}`);
    }
  };

  return {
    account,
    selectAccountAndRedirectTo,
  };
};

const DataServiceRoleProvider = ({ children }: { children: JSX.Element }) => {
  const { accountName } = useParams<{ accountName: string }>();

  const accountsWithRoles = useAccounts();
  const roleArn = useMemo(() => {
    //TODO: Being able to select which role in this account will be assumed
    const selectedAccount = accountsWithRoles.find(
      (account) => account.Name === accountName,
    );
    return selectedAccount?.Roles[0]?.Arn || '';
  }, [accountName, JSON.stringify(accountsWithRoles)]);

  return (
    <_DataServiceRoleContext.Provider
      value={{
        roleArn: roleArn,
      }}
    >
      {children}
    </_DataServiceRoleContext.Provider>
  );
};

export default DataServiceRoleProvider;
