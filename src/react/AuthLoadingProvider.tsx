import { useShellHooks } from '@scality/module-federation';
import { createContext, type JSX, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthError, useAuthFailure } from './ErrorProvider';
import { useConfig } from './next-architecture/ui/ConfigProvider';

type AuthLoadingContextValue = {
  isConfigLoaded: boolean;
  isClientsLoaded: boolean;
  configFailure: boolean;
  configFailureErrorMessage: string;
};

const AuthLoadingContext = createContext<AuthLoadingContextValue | null>(null);

export const useAuthLoading = () => {
  const context = useContext(AuthLoadingContext);

  if (!context) {
    throw new Error('The useAuthLoading hook can only be used within AuthLoadingProvider.');
  }

  return context;
};

const AuthLoadingProvider = ({ children }: { children: JSX.Element }) => {
  const config = useConfig();
  const { useAuth } = useShellHooks();
  const { userData } = useAuth();
  const { showAuthError } = useAuthError();
  const { setAuthFailure } = useAuthFailure();

  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [isClientsLoaded, setIsClientsLoaded] = useState(false);
  const [configFailure, setConfigFailure] = useState(false);
  const [configFailureErrorMessage, setConfigFailureErrorMessage] = useState('');

  useEffect(() => {
    if (!userData?.original?.profile?.sub || !config) {
      return;
    }

    if (isConfigLoaded) {
      return;
    }

    const instanceIds = userData?.original?.profile?.instanceIds;
    if (!instanceIds || instanceIds.length === 0) {
      const errorMessage = 'missing the "instanceIds" claim in ID token';
      showAuthError(errorMessage);
      setAuthFailure();
      setConfigFailure(true);
      setConfigFailureErrorMessage(errorMessage);
      return;
    }

    setIsConfigLoaded(true);
    setIsClientsLoaded(true);
  }, [
    config,
    userData?.original?.profile?.sub,
    isConfigLoaded,
    showAuthError,
    setAuthFailure,
    userData?.original?.profile?.instanceIds,
  ]);

  const contextValue = useMemo(
    () => ({
      isConfigLoaded,
      isClientsLoaded,
      configFailure,
      configFailureErrorMessage,
    }),
    [isConfigLoaded, isClientsLoaded, configFailure, configFailureErrorMessage],
  );

  return <AuthLoadingContext.Provider value={contextValue}>{children}</AuthLoadingContext.Provider>;
};

export default AuthLoadingProvider;
