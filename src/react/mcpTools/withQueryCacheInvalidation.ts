import { getMcpQueryClient } from './queryClientRef';

// Tools that observe state without mutating it — invalidating the cache
// after these would force a refetch with no fresh data to show. The S3 read
// tools auto-navigate (a navigation, not a mutation), so we also exclude
// them; users are looking at a fresh page that just mounted its queries.
//
// Anything not in this list is treated as a possible mutation: after a
// successful execute the wrapper invalidates ALL queries so the chat-side
// data-browser / accounts panels refetch and reflect the agent's changes.
const NO_INVALIDATION_TOOLS = new Set([
  'getApplicationRoutes',
  'getCurrentRoute',
  'navigateToRoute',
  'getAssumableRoles',
  'getCredentialsInstructions',
  'getAWSCLIS3Instructions',
  'getAWSCLIIamInstructions',
  'getIAMActions',
]);

/**
 * Wrap a tool's `execute` so that on success it invalidates the live
 * QueryClient (published from inside zenko-ui's React tree by
 * `McpQueryClientPublisher`). The chat-side UI panels (DataBrowserUI,
 * account views, etc.) then refetch and show the agent's mutation
 * without the user needing to reload.
 *
 * Read-only / navigation / introspection tools are left untouched — see
 * `NO_INVALIDATION_TOOLS`.
 */
export function withQueryCacheInvalidation<
  T extends {
    name: string;
    execute: (args: any, client: unknown) => Promise<unknown>;
  },
>(tool: T): T {
  if (NO_INVALIDATION_TOOLS.has(tool.name)) return tool;

  return {
    ...tool,
    execute: async (args: any, client: unknown) => {
      const result = await tool.execute(args, client);
      const qc = getMcpQueryClient();
      if (qc) {
        qc.invalidateQueries();
        console.debug('[mcp] invalidated react-query cache after', tool.name);
      } else {
        console.debug('[mcp] no QueryClient published yet; skipping invalidation after', tool.name);
      }
      return result;
    },
  };
}
