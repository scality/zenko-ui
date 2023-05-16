import { createContext, useContext } from 'react';
import IAMClient from '../js/IAMClient';

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
