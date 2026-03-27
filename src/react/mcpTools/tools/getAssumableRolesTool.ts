import { getRolesForWebIdentity } from '../../../js/IAMClient';
import { buildZenkoContext, ToolContext } from '../types';

export const getAssumableRolesTool = {
  name: 'getAssumableRoles',
  description:
    'Returns the list of account role ARNs that the authenticated user can assume via STS AssumeRoleWithWebIdentity. ' +
    'When selecting a role to pass to other tools, prefer in this order: ' +
    '1) a role whose ARN contains "storage-manager", ' +
    '2) a role whose ARN contains "storage-account-owner", ' +
    '3) if neither is available, ask the user which role to use.',
  inputSchema: {
    type: 'object',
    properties: {
      marker: {
        type: 'string',
        description: 'Pagination marker returned by a previous call when IsTruncated is true. Omit to get the first page.',
      },
    },
    required: [],
  },
  execute: async (
    params: { marker?: string; context: ToolContext },
    _client: unknown,
  ) => {
    const ctx = buildZenkoContext(params.context);
    const token = await ctx.getToken();
    return getRolesForWebIdentity(ctx.iamEndpoint, token, params.marker);
  },
};
