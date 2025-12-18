import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  JSX,
} from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../types/state';

type ErrorType = 'modal' | 'auth' | 'component';

type ErrorState = {
  message: string | null;
  type: ErrorType | null;
};

type ErrorContextValue = {
  error: ErrorState;
  showModalError: (message: string) => void;
  showAuthError: (message: string) => void;
  showComponentError: (message: string) => void;
  clearError: () => void;
};

const noop = () => undefined;
const fallbackContext: ErrorContextValue = {
  error: { message: null, type: null },
  showModalError: (msg) => console.error('[ErrorProvider not found]', msg),
  showAuthError: (msg) => console.error('[ErrorProvider not found]', msg),
  showComponentError: (msg) => console.error('[ErrorProvider not found]', msg),
  clearError: noop,
};

const ErrorContext = createContext<ErrorContextValue | null>(null);

export const useError = () => {
  const context = useContext(ErrorContext);
  // Fallback for federated modules loaded outside ErrorProvider
  return context ?? fallbackContext;
};

export const useModalError = () => {
  const { error, showModalError, clearError } = useError();
  return {
    modalError: error.type === 'modal' ? error.message : null,
    showModalError,
    clearModalError: clearError,
  };
};

export const useAuthError = () => {
  const { error, showAuthError, clearError } = useError();
  return {
    authError: error.type === 'auth' ? error.message : null,
    showAuthError,
    clearAuthError: clearError,
  };
};

export const useComponentError = () => {
  const { error, showComponentError, clearError } = useError();
  return {
    componentError: error.type === 'component' ? error.message : null,
    showComponentError,
    clearComponentError: clearError,
  };
};

const ErrorProvider = ({ children }: { children: JSX.Element }) => {
  const [error, setError] = useState<ErrorState>({
    message: null,
    type: null,
  });

  // Sync Redux uiErrors state (temporary, remove after full migration)
  const reduxErrorType = useSelector(
    (state: AppState) => state.uiErrors.errorType,
  );
  const reduxErrorMsg = useSelector(
    (state: AppState) => state.uiErrors.errorMsg,
  );

  useEffect(() => {
    if (reduxErrorType && reduxErrorMsg) {
      const typeMap: Record<string, ErrorType> = {
        byModal: 'modal',
        byAuth: 'auth',
        byComponent: 'component',
      };
      setError({
        message: reduxErrorMsg,
        type: typeMap[reduxErrorType] || 'modal',
      });
    }
  }, [reduxErrorType, reduxErrorMsg]);

  const showModalError = useCallback((message: string) => {
    setError({ message, type: 'modal' });
  }, []);

  const showAuthError = useCallback((message: string) => {
    setError({ message, type: 'auth' });
  }, []);

  const showComponentError = useCallback((message: string) => {
    setError({ message, type: 'component' });
  }, []);

  const clearError = useCallback(() => {
    setError({ message: null, type: null });
  }, []);

  const contextValue = useMemo(
    () => ({
      error,
      showModalError,
      showAuthError,
      showComponentError,
      clearError,
    }),
    [error, showModalError, showAuthError, showComponentError, clearError],
  );

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

export default ErrorProvider;

