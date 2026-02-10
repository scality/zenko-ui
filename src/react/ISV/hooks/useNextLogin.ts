import { useShellHooks } from '@scality/module-federation';
import { getSessionState } from '../../utils/localStorage';

export const useNextLogin = () => {
  const { useAuth } = useShellHooks();
  const actualSessionState = useAuth()?.userData?.original?.session_state;
  const localStorageSessionState = getSessionState();

  const isNextLogin = actualSessionState !== '' && actualSessionState !== localStorageSessionState;

  return { isNextLogin };
};
