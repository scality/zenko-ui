import '../css/index.css';

import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

import FederableApp from './FederableApp';

export const queryClient = new QueryClient();

const rootElement = document.getElementById('app');
rootElement &&
  ReactDOM.render(
    <QueryClientProvider client={queryClient}>
      <FederableApp />
    </QueryClientProvider>,
    rootElement,
  );
