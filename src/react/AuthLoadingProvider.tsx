import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  JSX,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useShellHooks } from '@scality/module-federation';
import { useConfig } from './next-architecture/ui/ConfigProvider';
import { loadAppConfig } from './actions';
import { AppState } from '../types/state';

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
    throw new Error(
      'The useAuthLoading hook can only be used within AuthLoadingProvider.',
    );
  }

  return context;
};

const AuthLoadingProvider = ({ children }: { children: JSX.Element }) => {
  const dispatch = useDispatch();
  const config = useConfig();
  const { useAuth } = useShellHooks();
  const { userData } = useAuth();

  const isConfigLoaded = useSelector(
    (state: AppState) => state.auth.isConfigLoaded,
  );
  const isClientsLoaded = useSelector(
    (state: AppState) => state.auth.isClientsLoaded,
  );
  const configFailure = useSelector(
    (state: AppState) => state.auth.configFailure,
  );
  const configFailureErrorMessage = useSelector((state: AppState) =>
    state.uiErrors.errorType === 'byComponent' ? state.uiErrors.errorMsg : '',
  );

  useEffect(() => {
    if (userData?.original?.profile?.sub && config && !isConfigLoaded) {
      dispatch(loadAppConfig(config, userData));
    }
  }, [dispatch, config, userData?.original?.profile?.sub, isConfigLoaded]);

  const contextValue = useMemo(
    () => ({
      isConfigLoaded,
      isClientsLoaded,
      configFailure,
      configFailureErrorMessage,
    }),
    [isConfigLoaded, isClientsLoaded, configFailure, configFailureErrorMessage],
  );

  return (
    <AuthLoadingContext.Provider value={contextValue}>
      {children}
    </AuthLoadingContext.Provider>
  );
};

export default AuthLoadingProvider;
