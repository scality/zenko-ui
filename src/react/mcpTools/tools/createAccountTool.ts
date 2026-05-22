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
    if (!token)
      throw new Error('No auth token available — user may not be logged in.');
    const instanceId = extractInstanceId(token);
    const result = await createAccountCore(ctx.managementEndpoint, token, {
      userName: params.name,
      email: params.email,
      instanceId,
    });
    // Refresh chat-side panels: the accounts list is sourced from
    // useAccountsLocationsEndpointsAdapter → ['WebIdentityRoles'] (see
    // src/react/utils/hooks.ts:195 — same key ISVApplyActions invalidates).
    // No separate ['accounts'] key in this codebase.
    ctx.queryClient?.invalidateQueries({ queryKey: ['WebIdentityRoles'] });
    return result;
  },
};
