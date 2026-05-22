import { computeS3ConfigIdentifier } from '@scality/data-browser-library';
import {
  createS3Tools,
  type MCPToolDefinition,
} from '@scality/data-browser-library/mcp-tools';
import { accountNameForRoleArn, inferSoleAccountName } from './accountsCache';
import { getCredentials } from './stsCredentialCache';
import { buildZenkoContext, type ToolContext } from './types';

/**
 * S3 region the chat-side DataBrowserProvider uses
 * (see DataServiceRoleProvider.tsx → DEFAULT_REGION). Mirrored here so the
 * tool-side queryKeyPrefix matches what the panel namespaces queries against;
 * if the panel and tools disagree the invalidations would silently miss.
 */
const PANEL_REGION = 'us-east-1';

/** Tool names that perform no S3 calls and don't need a roleArn. */
const NO_ROLE_TOOLS = new Set(['getApplicationRoutes', 'getCurrentRoute', 'navigateToRoute']);

/**
 * Resolve the basePath the data-browser library must prepend before calling
 * shell-ui's navigate function. Shell-ui hands `createTools` its top-level
 * `useNavigate()` (no app basename), so a bare `navigate('/buckets/test')`
 * lands on the shell root and falls back to `/`.
 *
 * Mirrors the formula zenko-ui uses internally for DataBrowserUI's basename
 * (see `src/react/databrowser/DataBrowser.tsx`):
 *
 *     `${selfConfiguration.basePath}/accounts/${accountName}`
 *
 * `selfConfiguration.basePath` is the host's mount prefix in deployed
 * ARTESCA (zenko-ui-operator templates `BasePath = /data`); locally in
 * standalone dev it's empty, in which case the prefix collapses to just
 * `/accounts/<name>` which is correct for that environment. We do NOT also
 * consult `/shell/deployed-ui-apps.json` (`appHistoryBasePath`) — that
 * registry advertises the same value and combining the two double-prefixes
 * the URL (a bug we shipped in a previous iteration: `/data/data/...`).
 *
 * Account name is runtime user state, not config, so we accept it from
 * either an explicit `accountName` arg on the tool call (preferred — the
 * agent already has it from `getAssumableRoles`) or fall back to the
 * `/accounts/<name>/` segment of the current URL when the user is already
 * browsing inside an account.
 */
function deriveHostBasePath(
  zenkoBasePath: string,
  options: {
    /** Explicitly passed by the LLM (e.g. via the navigateToRoute schema). */
    explicitAccountName?: string;
    /**
     * For S3 tools the LLM passes `roleArn`. We look up the owning account
     * from the `getAssumableRoles` cache (populated by getAssumableRolesTool).
     * This means S3 tool wrappers don't need a separate accountName arg — the
     * one already in roleArn is enough.
     */
    roleArn?: string;
  } = {},
): string {
  const { explicitAccountName, roleArn } = options;
  const fromUrl = window.location.pathname.match(/\/accounts\/([^/]+)/);
  const fromCache = roleArn ? accountNameForRoleArn(roleArn) : undefined;
  const fromSole = inferSoleAccountName();

  // Resolution order: explicit (from LLM) > URL > getAssumableRoles cache by
  // roleArn > sole-known-account fallback. Anything earlier wins; first
  // non-empty value is used.
  const accountName = explicitAccountName || fromUrl?.[1] || fromCache || fromSole || '';
  const accountSegment = accountName ? `/accounts/${accountName}` : '';
  const basePath = `${zenkoBasePath}${accountSegment}`;
  console.debug(
    '[deriveHostBasePath] zenkoBasePath=%o accountName=%o (explicit=%o, fromUrl=%o, fromCache=%o, fromSole=%o) → basePath=%o',
    zenkoBasePath, accountName, explicitAccountName, fromUrl?.[1], fromCache, fromSole, basePath,
  );
  return basePath;
}

/**
 * Builds the full set of data-browser S3 tools adapted for the Zenkocontext:
 *
 * - Every S3 operation tool gets `roleArn` added as a required input parameter.
 *   The execute wrapper resolves temporary STS credentials for that role before
 *   forwarding the call to the underlying library tool.
 *
 * - Navigation-only tools (getApplicationRoutes, navigateToRoute) are passed through
 *   as-is since they make no S3 calls and don't need a role.
 *
 * @param context  Shell-ui ToolContext (getToken, userData, selfConfiguration).
 * @param navigate React Router navigate function provided by shell-ui's MCPRegistrar.
 */
export function createZenkoS3Tools(
  context: ToolContext,
  navigate: (path: string) => void,
): MCPToolDefinition[] {
  const ctx = buildZenkoContext(context);
  const features = (ctx.selfConfiguration.features as string[] | undefined) ?? [];
  const tools = createS3Tools({ features });

  return tools.map((tool): MCPToolDefinition => {
    // Navigation tools: just inject navigate, no STS wrapping needed.
    // We compute basePath dynamically at call time so the lib's
    // navigateToRoute prepends the correct host prefix and getCurrentRoute
    // strips it before returning a route to the LLM (consistent with the
    // shapes from getApplicationRoutes).
    if (NO_ROLE_TOOLS.has(tool.name)) {
      // navigateToRoute additionally accepts an optional `accountName` so the
      // agent can navigate even when the user is currently outside any
      // account page (e.g. on `/` or `/data/accounts`). The agent already
      // knows the account from getAssumableRoles; without this we'd have no
      // way to compose `/<basePath>/accounts/<account>/<libRoute>` and the
      // shell catch-all would redirect to `/data/accounts`.
      const inputSchema = tool.name === 'navigateToRoute'
        ? {
            ...tool.inputSchema,
            properties: {
              ...(tool.inputSchema.properties as Record<string, unknown>),
              accountName: {
                type: 'string',
                description:
                  'Account whose data-browser the navigation targets ' +
                  '(use the `Name` from `getAssumableRoles`). Optional only when ' +
                  'the user is already on an /accounts/<name>/ page.',
              },
            },
          }
        : tool.inputSchema;

      return {
        ...tool,
        inputSchema,
        execute: async (args: Record<string, unknown> & { context: unknown }, client: unknown) => {
          const { context: _injected, accountName, ...rest } = args as {
            context?: unknown;
            accountName?: string;
            [key: string]: unknown;
          };
          const basePath = deriveHostBasePath(
            (ctx.selfConfiguration.basePath as string | undefined) ?? '',
            { explicitAccountName: typeof accountName === 'string' ? accountName : undefined },
          );
          return tool.execute({
            ...rest,
            context: {
              getS3Config: () => {
                throw new Error(`${tool.name} does not make S3 calls`);
              },
              navigate,
              basePath,
              // Navigation tools have no `invalidates` in the lib codegen,
              // so no queryClient/queryKeyPrefix needed here.
            },
          }, client);
        },
      };
    }

    // S3 operation tools: add roleArn to schema, resolve STS credentials at call time
    const wrappedSchema = {
      ...tool.inputSchema,
      properties: {
        roleArn: {
          type: 'string',
          description:
            'ARN of the role to assume for this operation. ' +
            'Use getAssumableRoles to list available roles.',
        },
        ...(tool.inputSchema.properties as Record<string, unknown>),
      },
      required: [
        'roleArn',
        ...((tool.inputSchema.required as string[]) ?? []),
      ],
    };

    return {
      ...tool,
      inputSchema: wrappedSchema,
      execute: async (
        args: Record<string, unknown> & { context: unknown },
        client: unknown,
      ) => {
        // Stringified object/array params (Gemini `dict[str, Any]` lapses)
        // are repaired inside @scality/data-browser-library's createS3Tools
        // wrapper before this execute runs, so `args` already has structured
        // values where the schema says it should.
        const { roleArn, context: _injected, ...s3Params } = args as {
          roleArn: string;
          context: unknown;
          [key: string]: unknown;
        };

        const token = await ctx.getToken();
        if (!token) throw new Error('No auth token available — user may not be logged in.');

        const creds = await getCredentials(
          ctx.stsEndpoint,
          token,
          roleArn,
          'mcp-s3',
        );

        // basePath is needed by `autoNavigateAfterOperation` (in the lib's
        // generated S3 tools) to land the post-success navigation on the
        // host's mounted route — without this it pushes `/buckets/...` raw
        // and shell-ui's catch-all redirects to `/data/accounts`. We resolve
        // accountName from the cached getAssumableRoles result keyed by the
        // roleArn the LLM passed, so this works even when the user is on
        // `/` or `/data/accounts` (no account in URL).
        const basePath = deriveHostBasePath(
          (ctx.selfConfiguration.basePath as string | undefined) ?? '',
          { roleArn },
        );

        // queryKeyPrefix mirrors what zenko-ui's chat-side DataBrowserProvider
        // computes via `computeS3ConfigIdentifier` — the same `cacheKey=roleArn`
        // + external zenkoEndpoint + DEFAULT_REGION the panel queries are
        // namespaced under (see DataServiceRoleProvider.tsx:73-114). The tool's
        // own SDK call uses a different internal endpoint for SigV4 reasons,
        // but the cache-sync target is the panel — so the prefix must match
        // the panel's, not the tool's wire request.
        const queryKeyPrefix = computeS3ConfigIdentifier({
          cacheKey: roleArn,
          region: PANEL_REGION,
          endpoint: ctx.zenkoEndpoint,
        });

        return tool.execute({
          ...s3Params,
          context: {
            // Two-stage proxy SigV4 setup: SDK signs against the internal S3
            // FQDN (matches what the ARTESCA ingress rewrites Host to via
            // `proxy_set_header Host`), but the wire request is sent to the
            // user-facing /zenko/s3 path. Without the proxy block the SDK
            // would sign Host=<external> + path=/zenko/s3/... and the backend
            // (which sees Host=<internal-fqdn> + path=/...) returns
            // SignatureDoesNotMatch. This mirrors the v2 monkey-patch in
            // src/react/utils/index.ts:initializeAWSSigner.
            getS3Config: () => ({
              endpoint: `https://${ctx.s3InternalFQDN}`,
              region: PANEL_REGION,
              forcePathStyle: true,
              credentials: {
                accessKeyId: creds.AccessKeyId,
                secretAccessKey: creds.SecretAccessKey,
                sessionToken: creds.SessionToken,
              },
              proxy: {
                enabled: true,
                endpoint: ctx.zenkoEndpoint,
                target: `https://${ctx.s3InternalFQDN}`,
              },
            }),
            navigate,
            basePath,
            // Intentionally omit queryClient: the chat-side data-browser
            // panels mount their `useQuery` observers against the library's
            // own @tanstack/react-query v5 QueryClient (defaultQueryClient),
            // not shell-ui's react-query v3 client we'd pass via ctx.
            // invalidateAfter falls back to defaultQueryClient when no client
            // is supplied here, which is what we want.
            queryKeyPrefix,
          },
        }, client);
      },
    };
  });
}
