import { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import IAMClient, { getAssumeRoleWithWebIdentityIAM } from '../js/IAMClient';
import { useQuery } from 'react-query';
import { AppState } from '../types/state';
import { selectAccountID } from './actions';
import { useAccounts } from './utils/hooks';

// Only exported to ease testing
export const _IAMContext = createContext<null | {
  iamClient: IAMClient | null;
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
  const { accountName } = useParams<{ accountName: string }>();
  const state = useSelector((state: AppState) => state);
  const { data: IAMClientResult } = useQuery({
    queryKey: ['IAMClient', accountName],
    queryFn: () => getAssumeRoleWithWebIdentityIAM(state, accountName),
    enabled: !!accountName && accountName !== '',
  });

  // FIXME Temporary fix to get the account each time you change URL
  const dispatch = useDispatch();
  const accounts = useAccounts();
  useEffect(() => {
    const account = accounts.find((a) => a.userName === accountName);
    if (!account) {
      return;
    }
    dispatch(selectAccountID(account.id));
  }, [accountName]);
  // END FIXME

  return (
    <_IAMContext.Provider
      value={{
        iamClient: IAMClientResult || null,
      }}
    >
      {children}
    </_IAMContext.Provider>
  );
};

export default IAMProvider;
