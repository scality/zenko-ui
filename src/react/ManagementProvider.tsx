import { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import IAMClient, { getAssumeRoleWithWebIdentityIAM } from '../js/IAMClient';
import { useQuery } from 'react-query';
import { AppState } from '../types/state';
import { selectAccountID, selectInstance } from './actions';
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
  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.oidc.user);
  const {
    oidc,
    auth: { config },
  } = useSelector((state: AppState) => state);
  const [mgtClient, setMgtClient] = useState<UiFacingApi | null>(null);

  useEffect(() => {
    const isAuthenticated = !!user && !user.expired;

    if (isAuthenticated) {
      makeMgtClient(config.managementEndpoint, oidc.user.id_token).then(
        (managementClient) => {
          setMgtClient(managementClient);
          // return Promise.all([
          //   dispatch(updateConfiguration()),
          //   dispatch(loadInstanceLatestStatus()),
          // ]);
        },
      );
    }
  }, [user]);
  // FIXME
  const instanceIds =
    oidc.user && oidc.user.profile && oidc.user.profile.instanceIds;
  // if (instanceIds?.length > 0) {
  //   dispatch(selectInstance(instanceIds[0])); // we need this but not sure what is this.
  // }

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
