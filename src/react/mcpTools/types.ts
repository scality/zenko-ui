import { genClientEndpoint } from '../../react/utils';

// Mirror of shell-ui's ToolContext — update when @mf-types/shell exposes mcp/types
export type UserData = {
  token: string;
  username: string;
  groups: string[];
  email: string;
  id: string;
};

export type ToolContext = {
  getToken: () => Promise<string | null>;
  userData: UserData | undefined;
  selfConfiguration: Record<string, unknown>;
};

export type ZenkoSelfConfiguration = {
  managementEndpoint: string;
  iamEndpoint: string;
  stsEndpoint: string;
  zenkoEndpoint: string;
};

export type ZenkoToolContext = ToolContext & ZenkoSelfConfiguration;

export function buildZenkoContext(context: ToolContext): ZenkoToolContext {
  const cfg = context.selfConfiguration as ZenkoSelfConfiguration;
  return {
    ...context,
    managementEndpoint: genClientEndpoint(cfg.managementEndpoint),
    iamEndpoint: genClientEndpoint(cfg.iamEndpoint),
    stsEndpoint: genClientEndpoint(cfg.stsEndpoint),
    zenkoEndpoint: genClientEndpoint(cfg.zenkoEndpoint),
  };
}

/**
 * Extract the instanceId from the OIDC token's instanceIds claim.
 * Returns the first instanceId or empty string if not present.
 */
export function extractInstanceId(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const instanceIds = payload.instanceIds;
    if (Array.isArray(instanceIds) && instanceIds.length > 0) {
      return instanceIds[0];
    }
  } catch {
    // invalid token shape
  }
  return '';
}
