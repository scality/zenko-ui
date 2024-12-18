import { createContext, useContext, JSX } from 'react';
import { IAccountsLocationsEndpointsAdapter } from '../adapters/accounts-locations/IAccountsLocationsEndpointsBundledAdapter';
import { PensieveAccountsLocationsAdapter } from '../adapters/accounts-locations/PensieveAccountsLocationsAdapter';
import { useInstanceId } from './AuthProvider';
import { useConfig } from './ConfigProvider';
import { useShellHooks } from '@scality/module-federation';

const _AccountsLocationsEndpointsAdapterContext = createContext<null | {
  accountsLocationsEndpointsAdapter: IAccountsLocationsEndpointsAdapter;
}>(null);

export const useAccountsLocationsEndpointsAdapter =
  (): IAccountsLocationsEndpointsAdapter => {
    const context = useContext(_AccountsLocationsEndpointsAdapterContext);

    if (!context) {
      throw new Error(
        'The useAccountsLocationsEndpointsAdapter hook can only be used within AccountsLocationsEndpointsAdapterProvider.',
      );
    }

    return context.accountsLocationsEndpointsAdapter;
  };

export const AccountsLocationsEndpointsAdapterProvider = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const instanceId = useInstanceId();
  const { managementEndpoint } = useConfig();
  const accountsLocationsEndpointsAdapter =
    new PensieveAccountsLocationsAdapter(
      managementEndpoint,
      instanceId,
      getToken,
    );
  return (
    <_AccountsLocationsEndpointsAdapterContext.Provider
      value={{ accountsLocationsEndpointsAdapter }}
    >
      {children}
    </_AccountsLocationsEndpointsAdapterContext.Provider>
  );
};
