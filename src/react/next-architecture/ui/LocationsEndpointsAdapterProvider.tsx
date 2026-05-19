import { useShellHooks } from '@scality/module-federation';
import { createContext, type JSX, useContext } from 'react';
import type { ILocationsEndpointsAdapter } from '../adapters/accounts-locations/ILocationsEndpointsBundledAdapter';
import { PensieveAccountsLocationsAdapter } from '../adapters/accounts-locations/PensieveAccountsLocationsAdapter';
import { useInstanceId } from './AuthProvider';
import { useConfig } from './ConfigProvider';

const _LocationsEndpointsAdapterContext = createContext<null | {
  locationsEndpointsAdapter: ILocationsEndpointsAdapter;
}>(null);

export const useLocationsEndpointsAdapter = (): ILocationsEndpointsAdapter => {
  const context = useContext(_LocationsEndpointsAdapterContext);

  if (!context) {
    throw new Error(
      'The useLocationsEndpointsAdapter hook can only be used within LocationsEndpointsAdapterProvider.',
    );
  }

  return context.locationsEndpointsAdapter;
};

export const LocationsEndpointsAdapterProvider = ({ children }: { children: JSX.Element }) => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const instanceId = useInstanceId();
  const { managementEndpoint } = useConfig();
  const locationsEndpointsAdapter = new PensieveAccountsLocationsAdapter(
    managementEndpoint,
    instanceId,
    getToken,
  );
  return (
    <_LocationsEndpointsAdapterContext.Provider value={{ locationsEndpointsAdapter }}>
      {children}
    </_LocationsEndpointsAdapterContext.Provider>
  );
};
