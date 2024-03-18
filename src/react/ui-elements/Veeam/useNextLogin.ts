import { useAuth } from '../../next-architecture/ui/AuthProvider';
import { getSessionState } from '../../utils/localStorage';

export const useNextLogin = () => {
  const actualSessionState = useAuth()?.userData?.original?.session_state;
  const localStorageSessionState = getSessionState();

  const isNextLogin =
    actualSessionState !== '' &&
    actualSessionState !== localStorageSessionState;

  return { isNextLogin };
};
