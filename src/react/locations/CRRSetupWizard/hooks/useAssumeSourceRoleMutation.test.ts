import { sourceStorageManagerRoleArn } from './useAssumeSourceRoleMutation';

describe('sourceStorageManagerRoleArn', () => {
  it('builds the storage-manager role ARN for the given account id', () => {
    expect(sourceStorageManagerRoleArn('123456789012')).toBe(
      'arn:aws:iam::123456789012:role/scality-internal/storage-manager-role',
    );
  });
});
