import '../css/index.css';
import { history, store } from './store';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import ZenkoUI from './ZenkoUI';

export const queryClient = new QueryClient();
const rootElement = document.getElementById('app');
rootElement &&
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <QueryClientProvider client={queryClient}>
          <ZenkoUI />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ConnectedRouter>
    </Provider>,
    rootElement,
  );
