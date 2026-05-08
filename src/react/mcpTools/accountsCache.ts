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

let cachedAccounts: AssumableAccount[] = [];

/**
 * Replace the cached account list. Called by `getAssumableRolesTool`'s wrapper
 * after a successful fetch. Pagination markers are accepted but for now we
 * just store whatever the latest call returned — STS roles list is small.
 */
export function setAssumableAccounts(result: unknown): void {
  if (!result || typeof result !== 'object') return;
  const accounts = (result as AssumableRolesResult).Accounts;
  if (Array.isArray(accounts)) {
    cachedAccounts = accounts;
  }
}

/**
 * Map a role ARN back to its owning account Name, if we've seen it via a
 * prior `getAssumableRoles` call this session.
 */
export function accountNameForRoleArn(roleArn: string): string | undefined {
  for (const account of cachedAccounts) {
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
  return cachedAccounts.length === 1 ? cachedAccounts[0].Name : undefined;
}
