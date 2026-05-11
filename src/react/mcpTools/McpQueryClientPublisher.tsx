import { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { setMcpQueryClient } from './queryClientRef';

/**
 * Bridge component: publishes the live React Query `QueryClient` to a
 * module-level ref so the MCP tool wrappers (`createZenkoS3Tools` etc.,
 * which run outside any React component) can invalidate the cache after
 * a successful agent operation.
 *
 * Render once near the top of the zenko-ui federated tree — anywhere
 * inside the `QueryClientProvider` context, so `useQueryClient()`
 * returns the same client the rest of the app uses.
 */
export function McpQueryClientPublisher(): null {
  const queryClient = useQueryClient();
  useEffect(() => {
    setMcpQueryClient(queryClient);
    return () => {
      setMcpQueryClient(null);
    };
  }, [queryClient]);
  return null;
}
