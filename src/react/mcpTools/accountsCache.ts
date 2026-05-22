// Module-level cache populated each time `getAssumableRolesTool` runs. Other
// MCP tool wrappers (createZenkoS3Tools.ts) consult this to map a roleArn back
// to the account `Name` so they can compose `<basePath>/accounts/<Name>/...`
// at navigate time without forcing the LLM to thread the account name into
// every S3 tool call.

type AssumableRole = { Name: string; Arn: string };
type AssumableAccount = {
  Name: string;
  CreationDate?: string;
  CanonicalId?: string;
  Roles: AssumableRole[];
};
type AssumableRolesResult = { IsTruncated?: boolean; Accounts?: AssumableAccount[] };

// Keyed by account Name so paginated calls upsert instead of clobbering.
let cachedAccounts: Map<string, AssumableAccount> = new Map();

/**
 * Merge a page of accounts into the cache. The first page of a paginated
 * fetch should pass `reset: true` so stale entries from a prior session
 * don't survive; subsequent pages pass `reset: false` (the default) so
 * roles from earlier pages stay reachable for `accountNameForRoleArn`.
 */
export function setAssumableAccounts(
  result: unknown,
  options: { reset?: boolean } = {},
): void {
  if (!result || typeof result !== 'object') return;
  const accounts = (result as AssumableRolesResult).Accounts;
  if (!Array.isArray(accounts)) return;
  if (options.reset) cachedAccounts = new Map();
  for (const account of accounts) {
    if (account?.Name) cachedAccounts.set(account.Name, account);
  }
}

/**
 * Map a role ARN back to its owning account Name, if we've seen it via a
 * prior `getAssumableRoles` call this session.
 */
export function accountNameForRoleArn(roleArn: string): string | undefined {
  for (const account of cachedAccounts.values()) {
    if (account.Roles?.some((r) => r.Arn === roleArn)) return account.Name;
  }
  return undefined;
}

/**
 * Best-effort guess when only one account is known — useful as a fallback
 * for `navigateToRoute` when the LLM didn't pass `accountName` and the
 * current URL doesn't contain `/accounts/<name>/`. Returns undefined when
 * the inference would be ambiguous.
 */
export function inferSoleAccountName(): string | undefined {
  if (cachedAccounts.size !== 1) return undefined;
  const [only] = cachedAccounts.values();
  return only.Name;
}
