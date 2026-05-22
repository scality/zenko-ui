import STSClient from '../../js/STSClient';

type CachedCredentials = {
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken: string;
  Expiration: Date;
};

// Module-level cache: roleArn → credentials
const cache = new Map<string, CachedCredentials>();

const EXPIRY_BUFFER_MS = 60_000; // refresh 60s before actual expiry

export async function getCredentials(
  stsEndpoint: string,
  token: string,
  roleArn: string,
  sessionName: string,
): Promise<CachedCredentials> {
  const cached = cache.get(roleArn);
  if (cached && cached.Expiration.getTime() - Date.now() > EXPIRY_BUFFER_MS) {
    console.debug('[stsCredentialCache] cache hit for roleArn=%s, expires=%s', roleArn, cached.Expiration);
    return cached;
  }

  console.debug('[stsCredentialCache] cache miss for roleArn=%s, assuming role', roleArn);
  const stsClient = new STSClient({ endpoint: stsEndpoint });
  const { Credentials } = await stsClient.assumeRoleWithWebIdentity({
    idToken: token,
    roleArn,
    RoleSessionName: sessionName,
  });

  // Drop entries that are already past the freshness window so the Map
  // stays bounded by the number of *live* roles, not the lifetime tally.
  // O(n) but only runs on a cache miss, which is rare.
  const now = Date.now();
  for (const [arn, c] of cache) {
    if (c.Expiration.getTime() - now <= EXPIRY_BUFFER_MS) cache.delete(arn);
  }

  const entry: CachedCredentials = {
    AccessKeyId: Credentials.AccessKeyId,
    SecretAccessKey: Credentials.SecretAccessKey,
    SessionToken: Credentials.SessionToken,
    Expiration: Credentials.Expiration,
  };
  cache.set(roleArn, entry);
  return entry;
}
