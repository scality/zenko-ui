import { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAccounts } from './utils/hooks';

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
