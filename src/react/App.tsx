import { QueryClient } from 'react-query';
import '../css/index.css';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '../QueryClientProvider';
import FederableApp from './FederableApp';

declare global {
  interface Window {
    shellUIRemoteEntryUrl: string;
  }
}
export const queryClient = new QueryClient();

const rootElement = document.getElementById('app');

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <FederableApp />
    </QueryClientProvider>,
  );
}
