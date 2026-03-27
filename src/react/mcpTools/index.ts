import { createAccountTool } from './tools/createAccountTool';
import { executeIAMActionTool } from './tools/executeIAMActionTool';
import { executeS3ActionTool } from './tools/executeS3ActionTool';
import { getAssumableRolesTool } from './tools/getAssumableRolesTool';
import { getAWSCLIIamInstructionsTool } from './tools/getAWSCLIIamInstructionsTool';
import { getAWSCLIS3InstructionsTool } from './tools/getAWSCLIS3InstructionsTool';
import { getCredentialsInstructionsTool } from './tools/getCredentialsInstructionsTool';
import { getIAMActionsTool } from './tools/getIAMActionsTool';
import { getS3ActionsTool } from './tools/getS3ActionsTool';

export const tools = [
  createAccountTool,
  getAssumableRolesTool,
  getCredentialsInstructionsTool,
  getAWSCLIS3InstructionsTool,
  getAWSCLIIamInstructionsTool,
  getS3ActionsTool,
  getIAMActionsTool,
  executeS3ActionTool,
  executeIAMActionTool,
];
