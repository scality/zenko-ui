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

export const queryClient = new QueryClient();

const rootElement = document.getElementById('app');
rootElement &&
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider>
            <AuthProvider>
              <DataServiceRoleProvider>
                <S3AssumeRoleClientProvider>
                  <ZenkoUI />
                  <ReactQueryDevtools initialIsOpen={false} />
                </S3AssumeRoleClientProvider>
              </DataServiceRoleProvider>
            </AuthProvider>
          </ConfigProvider>
        </QueryClientProvider>
      </ConnectedRouter>
    </Provider>,
    rootElement,
  );
