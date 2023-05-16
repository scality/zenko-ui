import '../css/index.css';
import { history, store } from './store';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import ZenkoUI from './ZenkoUI';
import { ConfigProvider } from './next-architecture/ui/ConfigProvider';
import { AuthProvider } from './next-architecture/ui/AuthProvider';
import { AccountsAdapterProvider } from './next-architecture/ui/AccountAdapterProvider';
import { AccessibleAccountsAdapterProvider } from './next-architecture/ui/AccessibleAccountsAdapterProvider';
import MetricsAdapterProvider from './next-architecture/ui/MetricsAdapterProvider';
import { LocationAdapterProvider } from './next-architecture/ui/LocationAdapterProvider';

export const queryClient = new QueryClient();

const rootElement = document.getElementById('app');
rootElement &&
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider>
            <AuthProvider>
              <AccountsAdapterProvider>
                <LocationAdapterProvider>
                  <AccessibleAccountsAdapterProvider>
                    <MetricsAdapterProvider>
                      <ZenkoUI />
                      <ReactQueryDevtools initialIsOpen={false} />
                    </MetricsAdapterProvider>
                  </AccessibleAccountsAdapterProvider>
                </LocationAdapterProvider>
              </AccountsAdapterProvider>
            </AuthProvider>
          </ConfigProvider>
        </QueryClientProvider>
      </ConnectedRouter>
    </Provider>,
    rootElement,
  );
