import { createContext, useContext } from 'react';
import { PensieveAccountsLocationsAdapter } from '../adapters/accounts-locations/PensieveAccountsLocationsAdapter';
import { useAccessToken, useInstanceId } from './AuthProvider';
import { useConfig } from './ConfigProvider';
import { IAccountsLocationsEndpointsAdapter } from '../adapters/accounts-locations/IAccountsLocationsEndpointsBundledAdapter';

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
  const token = useAccessToken();
  const instanceId = useInstanceId();
  const { managementEndpoint } = useConfig();
  const accountsLocationsEndpointsAdapter =
    new PensieveAccountsLocationsAdapter(managementEndpoint, instanceId, token);
  return (
    <_AccountsLocationsEndpointsAdapterContext.Provider
      value={{ accountsLocationsEndpointsAdapter }}
    >
      {children}
    </_AccountsLocationsEndpointsAdapterContext.Provider>
  );
};
