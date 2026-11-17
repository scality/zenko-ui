export const isBucketEligible = (
  name: string,
  unlockedNames: string[] | undefined,
  requireObjectLock: boolean,
): boolean => !requireObjectLock || !unlockedNames?.includes(name);
