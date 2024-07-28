import { createContext, useContext } from 'react';
import { ILocationsAdapter } from '../adapters/accounts-locations/ILocationsAdapter';
import { PensieveAccountsLocationsAdapter } from '../adapters/accounts-locations/PensieveAccountsLocationsAdapter';
import { useAuth, useInstanceId } from './AuthProvider';
import { useConfig } from './ConfigProvider';

const _LocationAdapterContext = createContext<null | {
  locationAdapter: ILocationsAdapter;
}>(null);

export const useLocationAdapter = (): ILocationsAdapter => {
  const context = useContext(_LocationAdapterContext);

  if (!context) {
    throw new Error(
      'The useLocationAdapter hook can only be used within LocationAdapterProvider.',
    );
  }

  return context.locationAdapter;
};

export const LocationAdapterProvider = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const { getToken } = useAuth();
  const instanceId = useInstanceId();
  const { managementEndpoint } = useConfig();

  const locationAdapter = new PensieveAccountsLocationsAdapter(
    managementEndpoint,
    instanceId,
    getToken,
  );
  return (
    <_LocationAdapterContext.Provider value={{ locationAdapter }}>
      {children}
    </_LocationAdapterContext.Provider>
  );
};
