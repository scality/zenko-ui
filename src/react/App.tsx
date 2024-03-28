import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import '../css/index.css';
import FederableApp from './FederableApp';
declare global {
  interface Window {
    shellUIRemoteEntryUrl: string;
  }
}
export const queryClient = new QueryClient();

const rootElement = document.getElementById('app');
rootElement &&
  ReactDOM.render(
    <QueryClientProvider client={queryClient}>
      <FederableApp />
    </QueryClientProvider>,
    rootElement,
  );
