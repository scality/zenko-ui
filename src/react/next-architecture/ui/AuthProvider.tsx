import { createContext } from 'react';
import { AuthUser } from '../../../types/auth';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorPage500 } from '@scality/core-ui/dist/components/error-pages/ErrorPage500.component';
import { ComponentWithFederatedImports } from '@scality/module-federation';

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

export type UserData = {
  token: string;
  username: string;
  groups: string[];
  //@ts-expect-error fix this when you are working on it
  roles: RoleNames[];
  email: string;
  id: string;
};
type ContextType = {
  userData?: UserData;
};

const authGlobal = {
  hooks: {},
};

export function useAuth(): ContextType {
  //@ts-expect-error fix this when you are working on it
  return authGlobal.hooks.useAuth();
}

const InternalAuthProvider = ({ moduleExports, children }) => {
  authGlobal.hooks = moduleExports['./auth/AuthProvider'];
  return <>{children}</>;
};

function ErrorFallback() {
  return <ErrorPage500 data-cy="sc-error-page500" locale={'en'} />;
}

export function AuthProvider({ children }: { children: JSX.Element }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ComponentWithFederatedImports
        componentWithInjectedImports={InternalAuthProvider}
        renderOnError={<ErrorPage500 />}
        componentProps={{
          children,
        }}
        federatedImports={[
          {
            scope: 'shell',
            module: './auth/AuthProvider',
            //@ts-expect-error fix this when you are working on it
            remoteEntryUrl: window.shellUIRemoteEntryUrl,
          },
        ]}
      />
    </ErrorBoundary>
  );
}
