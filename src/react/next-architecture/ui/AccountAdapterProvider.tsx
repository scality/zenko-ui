import { createContext, useContext } from 'react';
import { IAccountsAdapter } from '../adapters/accounts-locations/IAccountsAdapter';
import { PensieveAccountsLocationsAdapter } from '../adapters/accounts-locations/PensieveAccountsLocationsAdapter';
import { useAccessToken, useInstanceId } from './AuthProvider';
import { useConfig } from './ConfigProvider';

const _AccountsAdapterContext = createContext<null | {
  accountsAdapter: IAccountsAdapter;
}>(null);

export const useAccountsAdapter = (): IAccountsAdapter => {
  const context = useContext(_AccountsAdapterContext);

  if (!context) {
    throw new Error(
      'The useAccountsAdapter hook can only be used within AccountsAdapterProvider.',
    );
  }

  return context.accountsAdapter;
};

export const AccountsAdapterProvider = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const token = useAccessToken();
  const instanceId = useInstanceId();
  const { managementEndpoint } = useConfig();
  const accountsAdapter = new PensieveAccountsLocationsAdapter(
    managementEndpoint,
    instanceId,
    token,
  );
  return (
    <_AccountsAdapterContext.Provider value={{ accountsAdapter }}>
      {children}
    </_AccountsAdapterContext.Provider>
  );
};
