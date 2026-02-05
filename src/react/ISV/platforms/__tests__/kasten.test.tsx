import { KastenPlatform } from '../kasten';

describe('KastenPlatform', () => {
  describe('validator', () => {
    it('should validate correct data for new account', () => {
      const validData = {
        accountName: 'test-account',
        accountNameType: 'create',
        enableImmutableBackup: true,
        buckets: [{ name: 'test-bucket' }],
      };

      const { error } = KastenPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate correct data for existing account with IAM user', () => {
      const validData = {
        accountName: 'existing-account',
        accountNameType: 'existing',
        IAMUserName: 'test-iam-user',
        IAMUserNameType: 'create',
        generateKey: true,
        enableImmutableBackup: false,
        buckets: [{ name: 'my-bucket' }],
      };

      const { error } = KastenPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid bucket name', () => {
      const invalidData = {
        accountName: 'test-account',
        accountNameType: 'create',
        enableImmutableBackup: false,
        buckets: [{ name: 'INVALID_BUCKET' }],
      };

      const { error } = KastenPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject missing account name', () => {
      const invalidData = {
        accountNameType: 'create',
        enableImmutableBackup: false,
        buckets: [{ name: 'valid-bucket' }],
      };

      const { error } = KastenPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('policy generation', () => {
    it('should generate valid policy for buckets', () => {
      const policy = KastenPlatform.getPolicy(['bucket1', 'bucket2'], false);
      const parsed = JSON.parse(policy);

      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(2);
    });

    it('should include base actions for non-immutable bucket', () => {
      const policy = KastenPlatform.getPolicy(['bucket1'], false);
      const parsed = JSON.parse(policy);

      const actions = parsed.Statement[0].Action;
      expect(actions).toContain('s3:PutObject');
      expect(actions).toContain('s3:GetObject');
      expect(actions).toContain('s3:DeleteObject');

      const listActions = parsed.Statement[1].Action;
      expect(listActions).toContain('s3:ListBucket');
      expect(listActions).toContain('s3:ListAllMyBuckets');
    });

    it('should include immutable actions when immutable is true', () => {
      const policy = KastenPlatform.getPolicy(['bucket1'], true);
      const parsed = JSON.parse(policy);

      const actions = parsed.Statement[0].Action;
      expect(actions).toContain('s3:PutObjectRetention');
      expect(actions).toContain('s3:GetObjectRetention');
      expect(actions).toContain('s3:GetBucketObjectLockConfiguration');
      expect(actions).toContain('s3:GetObjectLegalHold');
      expect(actions).toContain('s3:PutObjectLegalHold');
    });
  });
});
