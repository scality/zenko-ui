import { buildZenkoContext, ToolContext } from '../types';

export const getCredentialsInstructionsTool = {
  name: 'getCredentialsInstructions',
  description:
    'Returns a ready-to-run AWS CLI command to obtain temporary S3/IAM credentials via STS AssumeRoleWithWebIdentity. ' +
    'Call getAssumableRoles first to get a valid roleArn.',
  inputSchema: {
    type: 'object',
    properties: {
      roleArn: {
        type: 'string',
        description: 'The role ARN to assume (from getAssumableRoles).',
      },
    },
    required: ['roleArn'],
  },
  annotations: {
    readOnlyHint: true,
  },
  execute: async (
    params: { roleArn: string; context: ToolContext },
    _client: unknown,
  ) => {
    const ctx = buildZenkoContext(params.context);
    const token = await ctx.getToken();

    return {
      description:
        'Run the following AWS CLI command to obtain temporary credentials, then export them as shown.',
      assumeRoleCommand: [
        'aws sts assume-role-with-web-identity',
        `  --endpoint-url ${ctx.stsEndpoint}`,
        `  --role-arn "${params.roleArn}"`,
        `  --web-identity-token "${token}"`,
        '  --role-session-name mcp-session',
        '  --no-verify-ssl',
      ].join(' \\\n'),
      exportCredentials: [
        '# From the JSON output of the command above:',
        'export AWS_ACCESS_KEY_ID=<Credentials.AccessKeyId>',
        'export AWS_SECRET_ACCESS_KEY=<Credentials.SecretAccessKey>',
        'export AWS_SESSION_TOKEN=<Credentials.SessionToken>',
        'export AWS_DEFAULT_REGION=us-east-1',
      ].join('\n'),
    };
  },
};
