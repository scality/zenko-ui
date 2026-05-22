import { buildZenkoContext, ToolContext } from '../types';

// oidc-client-js stores the active session under a key shaped like
// `oidc.user:<authority>:<client_id>`, where `<authority>` ends in
// `/auth/realms/<REALM>`. Parse the key to recover both at runtime so
// the snippet matches whatever realm/client the UI was configured with.
const discoverOidcConfig = (): { realm: string; clientId: string } => {
  const fallback = { realm: 'artesca', clientId: 'zenko-ui' };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('oidc.user:')) continue;
      const match = key.match(/\/auth\/realms\/([^/:]+):([^:]+)$/);
      if (match) return { realm: match[1], clientId: match[2] };
    }
  } catch {
    // localStorage unavailable (e.g. SSR) — fall through
  }
  return fallback;
};

export const getCredentialsInstructionsTool = {
  name: 'getCredentialsInstructions',
  description:
    'Returns a shell snippet to obtain temporary S3/IAM credentials via STS AssumeRoleWithWebIdentity. ' +
    "The snippet fetches an OIDC token locally via curl so the user's live bearer token never leaves " +
    'their shell or enters the chat context. Call getAssumableRoles first to get a valid roleArn.',
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
    const { realm, clientId } = discoverOidcConfig();

    const fetchTokenSnippet = [
      '# Fill in your OIDC credentials below. The token stays in your shell —',
      '# do not paste $TOKEN or the assume-role JSON output back into chat.',
      `OIDC_URL='${window.location.origin}'`,
      `OIDC_REALM='${realm}'`,
      `OIDC_CLIENT_ID='${clientId}'`,
      "OIDC_USER='<username>'",
      'read -rs -p "OIDC password: " OIDC_USER_PASSWORD; echo',
      '',
      'TOKEN=$(',
      '    curl -s -k "${OIDC_URL}/auth/realms/${OIDC_REALM}/protocol/openid-connect/token" \\',
      '        -d "client_id=${OIDC_CLIENT_ID}" \\',
      '        -d "username=${OIDC_USER}" \\',
      '        -d "password=${OIDC_USER_PASSWORD}" \\',
      '        -d "scope=openid" \\',
      '        -d "grant_type=password" | \\',
      "        jq -cr '.access_token'",
      ')',
    ].join('\n');

    const assumeRoleSnippet = [
      'aws sts assume-role-with-web-identity',
      `  --endpoint-url ${ctx.stsEndpoint}`,
      `  --role-arn "${params.roleArn}"`,
      '  --web-identity-token "$TOKEN"',
      '  --role-session-name mcp-session',
      '  --no-verify-ssl',
    ].join(' \\\n');

    return {
      description:
        'Run the snippet below in your terminal to obtain temporary credentials. ' +
        'The OIDC bearer token is fetched locally via curl and never sent back to the chat. ' +
        'Then export the credentials from the JSON output as shown.',
      assumeRoleCommand: `${fetchTokenSnippet}\n\n${assumeRoleSnippet}`,
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
