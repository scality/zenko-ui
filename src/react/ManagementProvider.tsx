import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../types/state';
import makeMgtClient from '../js/managementClient';
import { UiFacingApi } from '../js/managementClient/api';
import { useAccessToken } from './next-architecture/ui/AuthProvider';
import { useConfig } from './next-architecture/ui/ConfigProvider';

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
  const token = useAccessToken();
  const { managementEndpoint } = useConfig();

  const managementClient = useMemo(() => {
    if (token) {
      const managementClient = makeMgtClient(managementEndpoint, token);
      return managementClient;
    }
    return null;
  }, [token]);

  return (
    <_ManagementContext.Provider
      value={{
        managementClient,
      }}
    >
      {children}
    </_ManagementContext.Provider>
  );
};

export default ManagementProvider;
