import { createContext } from 'react';
import { AuthUser } from '../../../types/auth';
import { useShellHooks } from '@scality/module-federation';

//exported for testing purposes only
// TO BE DELETED
export const _AuthContext = createContext<{
  user?: AuthUser;
  setUser: (user?: AuthUser) => void;
} | null>(null);

export function useAccessToken() {
  const { useAuth } = useShellHooks();
  const user = useAuth();

  return user?.userData?.token ?? '';
}

export function useInstanceId() {
  const { useAuth } = useShellHooks();
  const user = useAuth();

  const instanceIds = user?.userData?.original?.profile?.instanceIds;

  if (
    !instanceIds ||
    (Array.isArray(instanceIds) && instanceIds.length === 0)
  ) {
    return '';
  }

  return instanceIds[0];
}
