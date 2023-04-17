import { createContext, useContext, useState } from 'react';
import { AuthUser } from '../../../types/auth';

const AuthContext = createContext<{
  user?: AuthUser;
  setUser: (user?: AuthUser) => void;
} | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | undefined>(undefined);
  return (
    <AuthContext.Provider value={{ user: authUser, setUser: setAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
}
