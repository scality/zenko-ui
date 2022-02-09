import React, { createContext, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getAssumeRoleWithWebIdentityIAM } from '../js/IAMClient';
import { useQuery } from 'react-query';

const IAMContext = createContext(null);

export const useIAMClient = () => {
  const IAMCtxt = useContext(IAMContext);

  if (!IAMCtxt) {
    throw new Error(
      'The useIAMClient hook can only be used within IAMProvider.',
    );
  }

  return IAMCtxt.iamClient;
};

const IAMProvider = ({ children }) => {
  const { accountName } = useParams();
  const [IAMClient, setIAMClient] = useState(null);
  const state = useSelector(state => state);

  useQuery({
    queryKey: ['updateIAMClient', accountName],
    queryFn: () => {
      return getAssumeRoleWithWebIdentityIAM(state, accountName).then(
        iamClient => {
          setIAMClient(iamClient);
        },
      );
    },
    enabled: accountName && accountName !== '',
  });

  return (
    <IAMContext.Provider value={{ iamClient: IAMClient }}>
      {children}
    </IAMContext.Provider>
  );
};

export default IAMProvider;
