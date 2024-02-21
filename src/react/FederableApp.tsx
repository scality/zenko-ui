import { Provider } from 'react-redux';
import { ReactQueryDevtools } from 'react-query/devtools';
import { applyMiddleware, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import { BrowserRouter, useHistory } from 'react-router-dom';
import ZenkoUI from './ZenkoUI';
import {
  ConfigProvider,
  useConfig,
} from './next-architecture/ui/ConfigProvider';
import { AuthProvider } from './next-architecture/ui/AuthProvider';
import { AccountsLocationsEndpointsAdapterProvider } from './next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { AccessibleAccountsAdapterProvider } from './next-architecture/ui/AccessibleAccountsAdapterProvider';
import MetricsAdapterProvider from './next-architecture/ui/MetricsAdapterProvider';
import { LocationAdapterProvider } from './next-architecture/ui/LocationAdapterProvider';

import zenkoUIReducer from './reducers';
import { useEffect, useMemo } from 'react';
import { XCoreLibraryProvider } from './next-architecture/ui/XCoreLibraryProvider';
import { ToastProvider } from '@scality/core-ui';

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
    <ConfigProvider>
      <XCoreLibraryProvider>
        <ToastProvider>
          <InternalRouter>
            <AuthProvider>
              <>
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
              </>
            </AuthProvider>
          </InternalRouter>
        </ToastProvider>
      </XCoreLibraryProvider>
    </ConfigProvider>
  );
};

export default FederableApp;
