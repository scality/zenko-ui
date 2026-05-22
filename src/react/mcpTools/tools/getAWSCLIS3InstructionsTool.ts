import { buildZenkoContext, ToolContext } from '../types';

export const getAWSCLIS3InstructionsTool = {
  name: 'getAWSCLIS3Instructions',
  description:
    'Returns ready-to-run AWS CLI commands to interact with S3-compatible object storage. ' +
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
    const e = ctx.zenkoEndpoint;
    const flags = `--endpoint-url ${e} --no-verify-ssl`;

    return {
      prerequisite:
        'Export AWS credentials first — use getCredentialsInstructions with a roleArn from getAssumableRoles.',
      commands: {
        listBuckets:
          `aws s3 ls ${flags}`,
        listObjects:
          `aws s3 ls s3://<bucket-name>/ ${flags}`,
        uploadFile:
          `aws s3 cp <local-file> s3://<bucket-name>/<key> ${flags}`,
        downloadFile:
          `aws s3 cp s3://<bucket-name>/<key> <local-path> ${flags}`,
        deleteObject:
          `aws s3 rm s3://<bucket-name>/<key> ${flags}`,
        createBucket:
          `aws s3 mb s3://<bucket-name> ${flags}`,
        syncDirectory:
          `aws s3 sync <local-dir>/ s3://<bucket-name>/<prefix>/ ${flags}`,
      },
      discoverAllCommands: 'aws s3 help\naws s3api help\naws s3api <command> help',
      note: 'Use --recursive with cp/rm for directories. All operations require AWS_DEFAULT_REGION=us-east-1.',
    };
  },
};
