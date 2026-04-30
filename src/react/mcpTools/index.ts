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
 */
export function createTools(
  context: ToolContext,
  navigate: (path: string) => void,
) {
  const zenkoContext = buildZenkoContext(context);

  // In the createTools factory approach shell-ui does NOT inject ToolContext into
  // params, so we bake zenkoContext into each Zenko tool's execute closure.
  function bake<T extends { execute: (args: any, client: unknown) => Promise<unknown> }>(
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
    ...createZenkoS3Tools(context, navigate),
  ];
}
