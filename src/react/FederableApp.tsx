import { ToastProvider } from '@scality/core-ui';
import { ReactQueryDevtools } from 'react-query/devtools';

import { AccessibleAccountsAdapterProvider } from './next-architecture/ui/AccessibleAccountsAdapterProvider';
import { AccountsLocationsEndpointsAdapterProvider } from './next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { LocationAdapterProvider } from './next-architecture/ui/LocationAdapterProvider';
import MetricsAdapterProvider from './next-architecture/ui/MetricsAdapterProvider';
import ZenkoUI from './ZenkoUI';
import AuthLoadingProvider from './AuthLoadingProvider';
import ErrorProvider from './ErrorProvider';

import { ShellHooksProvider, useBasenameRelativeNavigate, useCurrentApp } from '@scality/module-federation';
import React, { useEffect } from 'react';
import { ArtescaLibraryProvider } from './next-architecture/ui/ArtescaLibraryProvider';
import { XCoreLibraryProvider } from './next-architecture/ui/XCoreLibraryProvider';

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
    <ShellHooksProvider
      shellHooks={props.shellHooks}
      shellAlerts={props.shellAlerts}
    >
      <XCoreLibraryProvider>
        <ArtescaLibraryProvider>
          <HistoryPushEventListener />
          <ZenkoUIGuard>
            <AccountsLocationsEndpointsAdapterProvider>
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
            </AccountsLocationsEndpointsAdapterProvider>
          </ZenkoUIGuard>
        </ArtescaLibraryProvider>
      </XCoreLibraryProvider>
    </ShellHooksProvider>
  );
};

export default FederableApp;
