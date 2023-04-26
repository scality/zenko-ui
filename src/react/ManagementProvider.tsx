import { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../types/state';
import makeMgtClient from '../js/managementClient';
import { UiFacingApi } from '../js/managementClient/api';

// Only exported to ease testing
export const _ManagementContext = createContext<null | {
  managementClient: UiFacingApi | null;
}>(null);

export const useManagementClient = () => {
  const ManagementCtxt = useContext(_ManagementContext);

  if (!ManagementCtxt) {
    throw new Error(
      'The useManagementClient hook can only be used within ManagementProvider.',
    );
  }

  return ManagementCtxt.managementClient;
};

const ManagementProvider = ({ children }: { children: JSX.Element }) => {
  const user = useSelector((state: AppState) => state.oidc.user);
  const {
    auth: { config },
  } = useSelector((state: AppState) => state);
  const [mgtClient, setMgtClient] = useState<UiFacingApi | null>(null);

  useEffect(() => {
    const isAuthenticated = !!user && !user.expired;

    if (isAuthenticated) {
      const managementClient = makeMgtClient(
        config.managementEndpoint,
        user.access_token,
      );
      setMgtClient(managementClient);
    }
  }, [user]);

  return (
    <_ManagementContext.Provider
      value={{
        managementClient: mgtClient || null,
      }}
    >
      {children}
    </_ManagementContext.Provider>
  );
};

export default ManagementProvider;
