import '../css/index.css';
import { history, store } from './store';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import ZenkoUI from './ZenkoUI';
import { ConfigProvider } from './next-architecture/ui/ConfigProvider';
import DataServiceRoleProvider from './DataServiceRoleProvider';
import { S3AssumeRoleClientProvider } from './next-architecture/ui/S3ClientProvider';
import { AuthProvider } from './next-architecture/ui/AuthProvider';
import { AccountsAdapterProvider } from './next-architecture/ui/AccountAdapterProvider';
import { AccessibleAccountsAdapterProvider } from './next-architecture/ui/AccessibleAccountsAdapterProvider';
import MetricsAdapterProvider from './next-architecture/ui/MetricsAdapterProvider';

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
                <AccessibleAccountsAdapterProvider>
                  <MetricsAdapterProvider>
                    <DataServiceRoleProvider>
                      <S3AssumeRoleClientProvider>
                        <ZenkoUI />
                        <ReactQueryDevtools initialIsOpen={false} />
                      </S3AssumeRoleClientProvider>
                    </DataServiceRoleProvider>
                  </MetricsAdapterProvider>
                </AccessibleAccountsAdapterProvider>
              </AccountsAdapterProvider>
            </AuthProvider>
          </ConfigProvider>
        </QueryClientProvider>
      </ConnectedRouter>
    </Provider>,
    rootElement,
  );
