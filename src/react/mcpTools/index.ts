import { createZenkoS3Tools } from './createZenkoS3Tools';
import { createAccountTool } from './tools/createAccountTool';
import { executeIAMActionTool } from './tools/executeIAMActionTool';
import { getAssumableRolesTool } from './tools/getAssumableRolesTool';
import { getAWSCLIIamInstructionsTool } from './tools/getAWSCLIIamInstructionsTool';
import { getAWSCLIS3InstructionsTool } from './tools/getAWSCLIS3InstructionsTool';
import { getCredentialsInstructionsTool } from './tools/getCredentialsInstructionsTool';
import { getIAMActionsTool } from './tools/getIAMActionsTool';
import { buildZenkoContext, type ToolContext } from './types';

/**
 * Factory consumed by shell-ui's MCPRegistrar (createTools API).
 *
 * Returns all MCP tools exposed by zenko-ui:
 *   - Zenko-specific tools (account management, IAM, STS credentials, CLI instructions)
 *   - All data-browser S3 tools wrapped via createZenkoS3Tools — each S3 operation
 *     tool gains a roleArn parameter and resolves temporary STS credentials at call time.
 *
 * Call getAssumableRoles first to obtain a roleArn to pass to S3 tools.
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
  function bake<T extends { name: string; execute: (args: any, client: unknown) => Promise<unknown> }>(
    tool: T,
  ): T {
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
    bake(getIAMActionsTool),
    bake(executeIAMActionTool),
    // data-browser S3 tools adapted for Zenko: each gains a roleArn param
    // and resolves STS credentials at call time via createZenkoS3Tools.
    // Per-tool cache invalidation is emitted by the data-browser codegen
    // into each generated S3 tool's execute, scoped to the keys that tool
    // actually affects.
    ...createZenkoS3Tools(context, navigate),
  ];
}
