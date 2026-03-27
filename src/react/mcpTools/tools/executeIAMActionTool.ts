import IAM from 'aws-sdk/clients/iam';
import { getCredentials } from '../stsCredentialCache';
import { buildZenkoContext, ToolContext } from '../types';

export const executeIAMActionTool = {
  name: 'executeIAMAction',
  description:
    'Executes any IAM action on ARTESCA using the aws-sdk. ' +
    'Use getIAMActions to discover available action names and their parameters.',
  inputSchema: {
    type: 'object',
    properties: {
      roleArn: {
        type: 'string',
        description: 'Role ARN to assume (from getAssumableRoles).',
      },
      action: {
        type: 'string',
        description: 'camelCase IAM action name (e.g. listUsers, createUser). Use getIAMActions to list all.',
      },
      params: {
        type: 'object',
        description: 'Parameters for the action. Use getIAMActions to see required and optional params.',
      },
    },
    required: ['roleArn', 'action'],
  },
  execute: async (
    args: { roleArn: string; action: string; params?: Record<string, unknown>; context: ToolContext },
    _client: unknown,
  ) => {
    const ctx = buildZenkoContext(args.context);
    const params = typeof args.params === 'string' ? JSON.parse(args.params) : (args.params ?? {});
    console.debug('[executeIAMAction] action=%s params=%o endpoint=%s roleArn=%s', args.action, params, ctx.iamEndpoint, args.roleArn);
    const token = await ctx.getToken();

    const credentials = await getCredentials(ctx.stsEndpoint, token, args.roleArn, 'mcp-iam');
    console.debug('[executeIAMAction] credentials ready, AccessKeyId=%s', credentials.AccessKeyId);

    const iam = new IAM({
      endpoint: ctx.iamEndpoint,
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
      region: 'us-east-1',
    });

    const method = (iam as unknown as Record<string, unknown>)[args.action];
    if (typeof method !== 'function') {
      throw new Error(`Unknown IAM action: "${args.action}". Call getIAMActions to list valid actions.`);
    }

    console.debug('[executeIAMAction] calling iam.%s', args.action);
    return new Promise((resolve) => {
      (method as Function).call(iam, params, (err: unknown, data: unknown) => {
        if (err) {
          console.error('[executeIAMAction] iam.%s error:', args.action, err);
          const e = err as Record<string, unknown>;
          resolve({ error: { code: e['code'], message: e['message'], statusCode: e['statusCode'] } });
        } else {
          console.debug('[executeIAMAction] iam.%s success:', args.action, data);
          resolve(JSON.parse(JSON.stringify(data)));
        }
      });
    });
  },
};
