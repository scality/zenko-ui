import { createZenkoS3Tools } from './createZenkoS3Tools';
import { createAccountTool } from './tools/createAccountTool';
import { getAssumableRolesTool } from './tools/getAssumableRolesTool';
import { getAWSCLIIamInstructionsTool } from './tools/getAWSCLIIamInstructionsTool';
import { getAWSCLIS3InstructionsTool } from './tools/getAWSCLIS3InstructionsTool';
import { getCredentialsInstructionsTool } from './tools/getCredentialsInstructionsTool';
import { buildZenkoContext, type ToolContext } from './types';

/**
 * Factory consumed by shell-ui's MCPRegistrar (createTools API).
 *
 * Returns all MCP tools exposed by zenko-ui:
 *   - Zenko-specific tools (account management, IAM, STS credentials, CLI instructions)
 *   - The data-browser navigation tools, via createZenkoS3Tools. The S3 operation
 *     tools are not exposed.
 *
 * Cache-sync: shell-ui injects its shared QueryClient via `context.queryClient`,
 * and each individual tool's execute uses it directly (e.g. createAccount
 * invalidates `['accounts']` after success). There is no outer wrapper that
 * blanket-invalidates after every call — that approach blew away auth queries
 * in the past and left the UI empty.
 */
export function createTools(
  context: ToolContext,
  navigate: (path: string) => void,
) {
  const zenkoContext = buildZenkoContext(context);

  // shell-ui's createTools API does NOT inject ToolContext into params at call
  // time, so we bake zenkoContext (which carries the shared queryClient) into
  // each tool's execute closure here.
  function bake<
    T extends {
      name: string;
      execute: (args: Record<string, unknown>, client: unknown) => Promise<unknown>;
    },
  >(tool: T): T {
    return {
      ...tool,
      execute: (args: Record<string, unknown>, client: unknown) =>
        tool.execute({ ...args, context: zenkoContext }, client),
    };
  }

  return [
    bake(createAccountTool),
    bake(getAssumableRolesTool),
    bake(getCredentialsInstructionsTool),
    bake(getAWSCLIS3InstructionsTool),
    bake(getAWSCLIIamInstructionsTool),
    ...createZenkoS3Tools(context, navigate),
  ];
}
