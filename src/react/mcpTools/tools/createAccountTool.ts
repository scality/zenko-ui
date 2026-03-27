import { createAccountCore } from '../../../js/accountActions';
import { buildZenkoContext, extractInstanceId, ToolContext } from '../types';

export const createAccountTool = {
  name: 'createAccount',
  description:
    'Creates a new ARTESCA account with a unique name and a root email address. Returns the created account ID.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Account name (2–64 chars, alphanumeric + +=,.@ -)',
      },
      email: {
        type: 'string',
        description: 'Root account email address',
      },
    },
    required: ['name', 'email'],
  },
  execute: async (
    params: { name: string; email: string; context: ToolContext },
    _client: unknown,
  ) => {
    const ctx = buildZenkoContext(params.context);
    const token = await ctx.getToken();
    const instanceId = extractInstanceId(token);
    return createAccountCore(ctx.managementEndpoint, token, {
      userName: params.name,
      email: params.email,
      instanceId,
    });
  },
};
