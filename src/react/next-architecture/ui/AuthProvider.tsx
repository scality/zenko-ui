import { createContext } from 'react';
import { AuthUser } from '../../../types/auth';

//exported for testing purposes only
// TO BE DELETED
export const _AuthContext = createContext<{
  user?: AuthUser;
  setUser: (user?: AuthUser) => void;
} | null>(null);

export function useAccessToken() {
  const user = useAuth();

  return user?.userData?.token ?? '';
}

export function useInstanceId() {
  const user = useAuth();

  //@ts-expect-error fix this when you are working on it
  const instanceIds = user?.userData?.original?.profile?.instanceIds;

  if (!instanceIds || instanceIds.length === 0) {
    return '';
  }

  return instanceIds[0];
}

export function useAuth() {
  return window.shellHooks.useAuth();
}
