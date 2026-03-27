import S3 from 'aws-sdk/clients/s3';
import { genClientEndpoint } from '../../../react/utils';
import { getCredentials } from '../stsCredentialCache';
import { buildZenkoContext, ToolContext } from '../types';

export const executeS3ActionTool = {
  name: 'executeS3Action',
  description:
    'Executes any S3 action on ARTESCA using the aws-sdk. ' +
    'Use getS3Actions to discover available action names and their parameters.',
  inputSchema: {
    type: 'object',
    properties: {
      roleArn: {
        type: 'string',
        description: 'Role ARN to assume (from getAssumableRoles).',
      },
      action: {
        type: 'string',
        description: 'camelCase S3 action name (e.g. listBuckets, putObject). Use getS3Actions to list all.',
      },
      params: {
        type: 'object',
        description: 'Parameters for the action. Use getS3Actions to see required and optional params.',
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
    console.debug('[executeS3Action] action=%s params=%o endpoint=%s roleArn=%s', args.action, params, ctx.zenkoEndpoint, args.roleArn);
    const token = await ctx.getToken();

    const credentials = await getCredentials(ctx.stsEndpoint, token, args.roleArn, 'mcp-s3');
    console.debug('[executeS3Action] credentials ready, AccessKeyId=%s', credentials.AccessKeyId);

    const s3 = new S3({
      endpoint: genClientEndpoint(ctx.zenkoEndpoint),
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
      region: 'us-east-1',
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });

    const method = (s3 as unknown as Record<string, unknown>)[args.action];
    if (typeof method !== 'function') {
      throw new Error(`Unknown S3 action: "${args.action}". Call getS3Actions to list valid actions.`);
    }

    console.debug('[executeS3Action] calling s3.%s', args.action);
    return new Promise((resolve) => {
      (method as Function).call(s3, params, (err: unknown, data: unknown) => {
        if (err) {
          console.error('[executeS3Action] s3.%s error:', args.action, err);
          const e = err as Record<string, unknown>;
          resolve({ error: { code: e['code'], message: e['message'], statusCode: e['statusCode'] } });
        } else {
          console.debug('[executeS3Action] s3.%s success:', args.action, data);
          resolve(JSON.parse(JSON.stringify(data)));
        }
      });
    });
  },
};
