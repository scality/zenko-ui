import React, { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import IAMClient, { getAssumeRoleWithWebIdentityIAM } from '../js/IAMClient';
import { useQuery } from 'react-query';

const IAMContext = createContext<null | { iamClient: IAMClient }>(null);
export const useIAMClient = () => {
  const IAMCtxt = useContext(IAMContext);

  if (!IAMCtxt) {
    throw new Error(
      'The useIAMClient hook can only be used within IAMProvider.',
    );
  }

  return IAMCtxt.iamClient;
};

const IAMProvider = ({ children }: { children: JSX.Element }) => {
  const { accountName } = useParams<{ accountName: string }>();
  const state = useSelector(state => state);
  const { data: IAMClientResult } = useQuery({
    queryKey: ['IAMClient', accountName],
    queryFn: () => getAssumeRoleWithWebIdentityIAM(state, accountName),
    enabled: accountName && accountName !== '',
  });
  return (
    <IAMContext.Provider
      value={{
        iamClient: IAMClientResult || null,
      }}
    >
      {children}
    </IAMContext.Provider>
  );
};

export default IAMProvider;
