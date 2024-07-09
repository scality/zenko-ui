import { ReactQueryDevtools } from 'react-query/devtools';
import { Provider } from 'react-redux';
import { BrowserRouter, useHistory } from 'react-router-dom';
import { applyMiddleware, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import ZenkoUI from './ZenkoUI';
import { AccessibleAccountsAdapterProvider } from './next-architecture/ui/AccessibleAccountsAdapterProvider';
import { AccountsLocationsEndpointsAdapterProvider } from './next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useConfig } from './next-architecture/ui/ConfigProvider';
import { LocationAdapterProvider } from './next-architecture/ui/LocationAdapterProvider';
import MetricsAdapterProvider from './next-architecture/ui/MetricsAdapterProvider';

import React, { useEffect, useMemo } from 'react';
import { XCoreLibraryProvider } from './next-architecture/ui/XCoreLibraryProvider';
import zenkoUIReducer from './reducers';

//@ts-expect-error fix this when you are working on it
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const InternalRouter = ({ children }: { children: React.ReactNode }) => {
  const config = useConfig();
  const store = useMemo(
    () =>
      createStore(zenkoUIReducer(), composeEnhancers(applyMiddleware(thunk))),
    [],
  );

  return (
    <Provider store={store}>
      <BrowserRouter basename={config.basePath}>{children}</BrowserRouter>
    </Provider>
  );
};

const HistoryPushEventListener = () => {
  const history = useHistory();
  useEffect(() => {
    const listener = (event: CustomEvent) => {
      const path = event.detail.path;
      history.push(path);
    };
    window.addEventListener('HistoryPushEvent', listener);

    return () => {
      window.removeEventListener('HistoryPushEvent', listener);
    };
  }, [history]);

  return <></>;
};

const FederableApp = () => {
  return (
    <XCoreLibraryProvider>
      <InternalRouter>
        <HistoryPushEventListener />
        <AccountsLocationsEndpointsAdapterProvider>
          <LocationAdapterProvider>
            <AccessibleAccountsAdapterProvider>
              <MetricsAdapterProvider>
                <ZenkoUI />
                <ReactQueryDevtools initialIsOpen={false} />
              </MetricsAdapterProvider>
            </AccessibleAccountsAdapterProvider>
          </LocationAdapterProvider>
        </AccountsLocationsEndpointsAdapterProvider>
      </InternalRouter>
    </XCoreLibraryProvider>
  );
};

export default FederableApp;
