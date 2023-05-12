import { createContext, useContext, useState } from 'react';
import { AuthUser } from '../../../types/auth';

//exported for testing purposes only
export const _AuthContext = createContext<{
  user?: AuthUser;
  setUser: (user?: AuthUser) => void;
} | null>(null);

export function useAuth() {
  const context = useContext(_AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
}

export function useAccessToken() {
  const { user } = useAuth();
  return (user && user.access_token) || '';
}

export function useInstanceId() {
  const { user } = useAuth();

  const instanceIds = user && user.profile && user.profile.instanceIds;

  if (!instanceIds || instanceIds.length === 0) {
    return '';
  }

  return instanceIds[0];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | undefined>(undefined);
  return (
    <_AuthContext.Provider value={{ user: authUser, setUser: setAuthUser }}>
      {children}
    </_AuthContext.Provider>
  );
}
