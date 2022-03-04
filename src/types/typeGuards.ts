export function notFalsyTypeGuard<T>(entityOrFalsy: T | null | undefined | 0 | ''): T {
  if (!entityOrFalsy) {
    throw new Error('Entity not defined');
  }

  return entityOrFalsy;
}
