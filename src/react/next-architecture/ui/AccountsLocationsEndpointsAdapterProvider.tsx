import { useShellHooks } from '@scality/module-federation';
import { createContext, type JSX, useContext } from 'react';
import type { IAccountsLocationsEndpointsAdapter } from '../adapters/accounts-locations/IAccountsLocationsEndpointsBundledAdapter';
import { VaultAccountsLocationsAdapter } from '../adapters/accounts-locations/VaultAccountsLocationsAdapter';
import { useInstanceId } from './AuthProvider';
import { useConfig } from './ConfigProvider';

const _AccountsLocationsEndpointsAdapterContext = createContext<null | {
  accountsLocationsEndpointsAdapter: IAccountsLocationsEndpointsAdapter;
}>(null);

export const useAccountsLocationsEndpointsAdapter = (): IAccountsLocationsEndpointsAdapter => {
  const context = useContext(_AccountsLocationsEndpointsAdapterContext);

  if (!context) {
    throw new Error(
      'The useAccountsLocationsEndpointsAdapter hook can only be used within AccountsLocationsEndpointsAdapterProvider.',
    );
  }

  return context.accountsLocationsEndpointsAdapter;
};

export const AccountsLocationsEndpointsAdapterProvider = ({ children }: { children: JSX.Element }) => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const instanceId = useInstanceId();
  const { managementEndpoint, iamEndpoint } = useConfig();
  const accountsLocationsEndpointsAdapter = new VaultAccountsLocationsAdapter(
    iamEndpoint,
    getToken,
    managementEndpoint,
    instanceId,
  );
  return (
    <_AccountsLocationsEndpointsAdapterContext.Provider value={{ accountsLocationsEndpointsAdapter }}>
      {children}
    </_AccountsLocationsEndpointsAdapterContext.Provider>
  );
};
