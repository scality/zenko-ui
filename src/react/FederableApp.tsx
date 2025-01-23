import { ToastProvider } from '@scality/core-ui';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore } from 'redux';

import thunk from 'redux-thunk';
import { AccessibleAccountsAdapterProvider } from './next-architecture/ui/AccessibleAccountsAdapterProvider';
import { AccountsLocationsEndpointsAdapterProvider } from './next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { LocationAdapterProvider } from './next-architecture/ui/LocationAdapterProvider';
import MetricsAdapterProvider from './next-architecture/ui/MetricsAdapterProvider';
import ZenkoUI from './ZenkoUI';

import React, { useEffect, useMemo } from 'react';
import { XCoreLibraryProvider } from './next-architecture/ui/XCoreLibraryProvider';
import zenkoUIReducer from './reducers';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { ShellHooksProvider } from '@scality/module-federation';

//@ts-expect-error fix this when you are working on it
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const InternalRouter = ({ children }: { children: React.ReactNode }) => {
  const store = useMemo(
    () =>
      createStore(zenkoUIReducer(), composeEnhancers(applyMiddleware(thunk))),
    [],
  );

  return (
    <Provider store={store}>
      <>{children}</>
    </Provider>
  );
};

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

const FederableApp = (props) => {
  return (
    <ShellHooksProvider
      shellHooks={props.shellHooks}
      shellAlerts={props.shellAlerts}
    >
      <XCoreLibraryProvider>
        <InternalRouter>
          <HistoryPushEventListener />
          <AccountsLocationsEndpointsAdapterProvider>
            <LocationAdapterProvider>
              <AccessibleAccountsAdapterProvider>
                <MetricsAdapterProvider>
                  <ToastProvider>
                    <ZenkoUI />
                  </ToastProvider>
                  <ReactQueryDevtools initialIsOpen={false} />
                </MetricsAdapterProvider>
              </AccessibleAccountsAdapterProvider>
            </LocationAdapterProvider>
          </AccountsLocationsEndpointsAdapterProvider>
        </InternalRouter>
      </XCoreLibraryProvider>
    </ShellHooksProvider>
  );
};

export default FederableApp;
