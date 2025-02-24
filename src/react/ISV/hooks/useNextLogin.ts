import { getSessionState } from '../../utils/localStorage';
import { useShellHooks } from '@scality/module-federation';

export const useNextLogin = () => {
  const { useAuth } = useShellHooks();
  const actualSessionState = useAuth()?.userData?.original?.session_state;
  const localStorageSessionState = getSessionState();

  const isNextLogin =
    actualSessionState !== '' &&
    actualSessionState !== localStorageSessionState;

  return { isNextLogin };
};
