import { toSourceObjectLockEnabled } from './sourceObjectLock';

describe('toSourceObjectLockEnabled', () => {
  it('is true when Object Lock is enabled on the bucket', () => {
    expect(
      toSourceObjectLockEnabled({ data: { ObjectLockConfiguration: { ObjectLockEnabled: 'Enabled' } }, isLoading: false }),
    ).toBe(true);
  });

  it('is false when the bucket has no Object Lock configuration', () => {
    expect(
      toSourceObjectLockEnabled({ error: { name: 'ObjectLockConfigurationNotFoundError' }, isLoading: false }),
    ).toBe(false);
  });

  it('is false when the configuration is returned without Object Lock enabled', () => {
    expect(toSourceObjectLockEnabled({ data: { ObjectLockConfiguration: {} }, isLoading: false })).toBe(false);
  });

  it('is unknown when access to the configuration is denied', () => {
    expect(toSourceObjectLockEnabled({ error: { name: 'AccessDenied' }, isLoading: false })).toBeNull();
  });

  it('is unknown while the configuration is loading', () => {
    expect(toSourceObjectLockEnabled({ data: undefined, error: null, isLoading: true })).toBeNull();
  });
});
