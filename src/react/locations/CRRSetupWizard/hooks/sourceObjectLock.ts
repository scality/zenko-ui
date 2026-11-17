const OBJECT_LOCK_NOT_FOUND_ERROR = 'ObjectLockConfigurationNotFoundError';

type ObjectLockQuery = {
  data?: { ObjectLockConfiguration?: { ObjectLockEnabled?: string } };
  error?: { name?: string } | null;
  isLoading: boolean;
};

export const toSourceObjectLockEnabled = (query: ObjectLockQuery): boolean | null => {
  if (query.data?.ObjectLockConfiguration?.ObjectLockEnabled === 'Enabled') return true;
  if (query.error?.name === OBJECT_LOCK_NOT_FOUND_ERROR) return false;
  return null;
};
