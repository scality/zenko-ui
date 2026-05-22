import { buildZenkoContext, ToolContext } from '../types';

export const getAWSCLIIamInstructionsTool = {
  name: 'getAWSCLIIamInstructions',
  description:
    'Returns ready-to-run AWS CLI commands to manage IAM users, access keys, and policies. ' +
    'Requires credentials — call getCredentialsInstructions with a roleArn first.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  annotations: {
    readOnlyHint: true,
  },
  execute: async (
    params: { context: ToolContext },
    _client: unknown,
  ) => {
    const ctx = buildZenkoContext(params.context);
    const e = ctx.iamEndpoint;
    const flags = `--endpoint-url ${e} --no-verify-ssl`;

    return {
      prerequisite:
        'Export AWS credentials first — use getCredentialsInstructions with a roleArn from getAssumableRoles.',
      commands: {
        listUsers:
          `aws iam list-users ${flags}`,
        createUser:
          `aws iam create-user --user-name <name> ${flags}`,
        deleteUser:
          `aws iam delete-user --user-name <name> ${flags}`,
        createAccessKey:
          `aws iam create-access-key --user-name <name> ${flags}`,
        deleteAccessKey:
          `aws iam delete-access-key --user-name <name> --access-key-id <key-id> ${flags}`,
        createPolicy:
          `aws iam create-policy --policy-name <name> --policy-document file://policy.json ${flags}`,
        attachUserPolicy:
          `aws iam attach-user-policy --user-name <name> --policy-arn <arn> ${flags}`,
        detachUserPolicy:
          `aws iam detach-user-policy --user-name <name> --policy-arn <arn> ${flags}`,
        listUserPolicies:
          `aws iam list-attached-user-policies --user-name <name> ${flags}`,
      },
      discoverAllCommands: 'aws iam help\naws iam <command> help',
      note: 'These commands manage IAM resources scoped to the assumed account role.',
    };
  },
};
