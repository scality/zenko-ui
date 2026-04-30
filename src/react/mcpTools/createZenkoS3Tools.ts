import {
  createS3Tools,
  type MCPToolDefinition,
} from '@scality/data-browser-library/mcp-tools';
import { getCredentials } from './stsCredentialCache';
import { buildZenkoContext, type ToolContext } from './types';

/** Tool names that perform no S3 calls and don't need a roleArn. */
const NO_ROLE_TOOLS = new Set(['getApplicationRoutes', 'navigateToRoute']);

/**
 * Builds the full set of data-browser S3 tools adapted for the Zenko/ARTESCA context:
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
    // Navigation tools: just inject navigate, no STS wrapping needed
    if (NO_ROLE_TOOLS.has(tool.name)) {
      return {
        ...tool,
        execute: async (args: Record<string, unknown> & { context: unknown }, client: unknown) => {
          const { context: _injected, ...rest } = args;
          return tool.execute({
            ...rest,
            context: {
              getS3Config: () => {
                throw new Error(`${tool.name} does not make S3 calls`);
              },
              navigate,
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

        return tool.execute({
          ...s3Params,
          context: {
            getS3Config: () => ({
              endpoint: ctx.zenkoEndpoint,
              region: 'us-east-1',
              forcePathStyle: true,
              credentials: {
                accessKeyId: creds.AccessKeyId,
                secretAccessKey: creds.SecretAccessKey,
                sessionToken: creds.SessionToken,
              },
            }),
            navigate,
          },
        }, client);
      },
    };
  });
}
