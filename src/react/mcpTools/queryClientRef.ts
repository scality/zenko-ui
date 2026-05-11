// Module-level reference to the React Query `QueryClient` that the live
// zenko-ui React tree is using. Published from a small component inside the
// federated tree (so it picks up the federated context's client when zenko-ui
// is mounted under shell-ui, or zenko-ui's own client in standalone mode)
// and consumed from `createZenkoS3Tools` / the Zenko-specific tool wrappers
// which run outside any React component and therefore cannot use the
// `useQueryClient()` hook directly.
//
// After every successful MCP tool execution the wrappers call
// `getMcpQueryClient()?.invalidateQueries()` so the chat-side panels
// (DataBrowserUI, accounts, etc.) refetch and show the agent's changes
// without the user having to reload.

import type { QueryClient } from 'react-query';

let currentQueryClient: QueryClient | null = null;

export function setMcpQueryClient(qc: QueryClient | null): void {
  currentQueryClient = qc;
}

export function getMcpQueryClient(): QueryClient | null {
  return currentQueryClient;
}
