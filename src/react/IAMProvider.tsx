import { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';

import IAMClient, { getAssumeRoleWithWebIdentityIAM } from '../js/IAMClient';
import { AppState } from '../types/state';
import { useDataServiceRole } from './DataServiceRoleProvider';
import Loader from './ui-elements/Loader';

// Only exported to ease testing
export const _IAMContext = createContext<null | {
  iamClient: IAMClient;
}>(null);

export const useIAMClient = () => {
  const IAMCtxt = useContext(_IAMContext);

  if (!IAMCtxt) {
    throw new Error(
      'The useIAMClient hook can only be used within IAMProvider.',
    );
  }

  return IAMCtxt.iamClient;
};

const IAMProvider = ({ children }: { children: JSX.Element }) => {
  const state = useSelector((state: AppState) => state);

  const { roleArn } = useDataServiceRole();
  const { data: IAMClientResult, status } = useQuery({
    queryKey: ['IAMClient', roleArn],
    queryFn: () => getAssumeRoleWithWebIdentityIAM(state, roleArn),
    enabled: !!roleArn && roleArn !== '',
  });

  if (
    status === 'loading' ||
    status === 'idle' ||
    IAMClientResult === undefined
  ) {
    return (
      <Loader>
        <div>Loading clients</div>
      </Loader>
    );
  }

  return (
    <_IAMContext.Provider
      value={{
        iamClient: IAMClientResult,
      }}
    >
      {children}
    </_IAMContext.Provider>
  );
};

export default IAMProvider;
