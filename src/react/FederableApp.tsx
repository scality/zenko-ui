import { ToastProvider } from '@scality/core-ui';
import { ShellHooksProvider, useBasenameRelativeNavigate, useCurrentApp } from '@scality/module-federation';
import type React from 'react';
import { useEffect } from 'react';
import { ReactQueryDevtools } from 'react-query/devtools';
import AuthLoadingProvider from './AuthLoadingProvider';
import ErrorProvider from './ErrorProvider';
import { AccessibleAccountsAdapterProvider } from './next-architecture/ui/AccessibleAccountsAdapterProvider';
import { LocationsEndpointsAdapterProvider } from './next-architecture/ui/LocationsEndpointsAdapterProvider';
import { ArtescaLibraryProvider } from './next-architecture/ui/ArtescaLibraryProvider';
import { LocationAdapterProvider } from './next-architecture/ui/LocationAdapterProvider';
import MetricsAdapterProvider from './next-architecture/ui/MetricsAdapterProvider';
import { XCoreLibraryProvider } from './next-architecture/ui/XCoreLibraryProvider';
import ZenkoUI from './ZenkoUI';

const HistoryPushEventListener = () => {
  const navigate = useBasenameRelativeNavigate();
  useEffect(() => {
    const listener = (event: CustomEvent) => {
      const path = event.detail.path;
      navigate(path);
    };
    window.addEventListener('HistoryPushEvent', listener);

    return () => {
      window.removeEventListener('HistoryPushEvent', listener);
    };
  }, [navigate]);

  return <></>;
};

// This component prevent the app to be rendered if the current app is not a zenko-ui
// This happens when the app is in transition to another app
const ZenkoUIGuard = ({ children }: { children: React.ReactNode }) => {
  const { kind } = useCurrentApp();

  if (kind !== 'zenko-ui') {
    return null;
  }
  return <>{children}</>;
};

const FederableApp = (props) => {
  return (
    <ShellHooksProvider shellHooks={props.shellHooks} shellAlerts={props.shellAlerts}>
      <XCoreLibraryProvider>
        <ArtescaLibraryProvider>
          <HistoryPushEventListener />
          <ZenkoUIGuard>
            <LocationsEndpointsAdapterProvider>
              <LocationAdapterProvider>
                <AccessibleAccountsAdapterProvider>
                  <MetricsAdapterProvider>
                    <ToastProvider>
                      <ErrorProvider>
                        <AuthLoadingProvider>
                          <ZenkoUI />
                        </AuthLoadingProvider>
                      </ErrorProvider>
                    </ToastProvider>
                    <ReactQueryDevtools initialIsOpen={false} />
                  </MetricsAdapterProvider>
                </AccessibleAccountsAdapterProvider>
              </LocationAdapterProvider>
            </LocationsEndpointsAdapterProvider>
          </ZenkoUIGuard>
        </ArtescaLibraryProvider>
      </XCoreLibraryProvider>
    </ShellHooksProvider>
  );
};

export default FederableApp;
