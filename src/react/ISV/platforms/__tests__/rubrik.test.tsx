import { RubrikPlatform } from '../rubrik';

describe('RubrikPlatform', () => {
  describe('validator', () => {
    it('should validate correct data for new account', () => {
      const validData = {
        accountName: 'test-account',
        accountNameType: 'create',
        buckets: [{ name: 'test-rubrik-0' }],
      };

      const { error } = RubrikPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate correct data for existing account with IAM user', () => {
      const validData = {
        accountName: 'existing-account',
        accountNameType: 'existing',
        IAMUserName: 'test-iam-user',
        IAMUserNameType: 'create',
        generateKey: true,
        buckets: [{ name: 'my-archive-rubrik-0' }],
      };

      const { error } = RubrikPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should not require enableImmutableBackup', () => {
      const validData = {
        accountName: 'test-account',
        accountNameType: 'create',
        buckets: [{ name: 'test-rubrik-0' }],
        // enableImmutableBackup intentionally absent
      };

      const { error } = RubrikPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid bucket name', () => {
      const invalidData = {
        accountName: 'test-account',
        accountNameType: 'create',
        buckets: [{ name: 'INVALID_BUCKET' }],
      };

      const { error } = RubrikPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject missing account name', () => {
      const invalidData = {
        accountNameType: 'create',
        buckets: [{ name: 'valid-rubrik-0' }],
      };

      const { error } = RubrikPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('policy generation', () => {
    it('should generate valid JSON policy with two statements', () => {
      const policy = RubrikPlatform.getPolicy(['my-archive-rubrik-0'], false);
      const parsed = JSON.parse(policy);

      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(2);
      expect(parsed.Statement[0].Sid).toBe('RubrikPolicy');
      expect(parsed.Statement[1].Sid).toBe('RubrikListBuckets');
    });

    it('should include all defaultActions and Rubrik-specific actions in statement 0', () => {
      const policy = RubrikPlatform.getPolicy(['bucket1'], false);
      const parsed = JSON.parse(policy);
      const actions = parsed.Statement[0].Action;

      // defaultActions (required for policy update fingerprinting)
      expect(actions).toContain('s3:GetObject');
      expect(actions).toContain('s3:PutObject');
      expect(actions).toContain('s3:DeleteObject');
      expect(actions).toContain('s3:GetBucketLocation');
      expect(actions).toContain('s3:GetBucketVersioning');
      expect(actions).toContain('s3:GetBucketObjectLockConfiguration');
      // Rubrik-specific actions
      expect(actions).toContain('s3:AbortMultipartUpload');
      expect(actions).toContain('s3:ListMultipartUploadParts');
      expect(actions).toContain('s3:ListBucketMultipartUploads');
      expect(actions).toContain('s3:RestoreObject');
      expect(actions).toContain('s3:CreateBucket');
      expect(actions).toContain('s3:GetBucketAcl');
    });

    it('should scope statement 0 resources to bucket/* and bucket ARN', () => {
      const policy = RubrikPlatform.getPolicy(['my-archive-rubrik-0'], false);
      const parsed = JSON.parse(policy);
      const resources = parsed.Statement[0].Resource;

      expect(resources).toContain('arn:aws:s3:::my-archive-rubrik-0/*');
      expect(resources).toContain('arn:aws:s3:::my-archive-rubrik-0');
    });

    it('should have ListAllMyBuckets and ListBucket on * in statement 1', () => {
      const policy = RubrikPlatform.getPolicy(['bucket1'], false);
      const parsed = JSON.parse(policy);
      const stmt1 = parsed.Statement[1];

      expect(stmt1.Action).toContain('s3:ListAllMyBuckets');
      expect(stmt1.Action).toContain('s3:ListBucket');
      expect(stmt1.Resource).toBe('*');
    });

    it('should generate the same policy regardless of isImmutable flag', () => {
      const policyNonImmutable = RubrikPlatform.getPolicy(['bucket1'], false);
      const policyImmutable = RubrikPlatform.getPolicy(['bucket1'], true);

      expect(policyNonImmutable).toBe(policyImmutable);
    });

    it('should include resources for multiple buckets', () => {
      const policy = RubrikPlatform.getPolicy(['bucket1', 'bucket2'], false);
      const parsed = JSON.parse(policy);
      const resources = parsed.Statement[0].Resource;

      expect(resources).toContain('arn:aws:s3:::bucket1/*');
      expect(resources).toContain('arn:aws:s3:::bucket2/*');
    });
  });

  describe('platform config', () => {
    it('should have assistant enabled', () => {
      expect(RubrikPlatform.assistant).toBe(true);
    });

    it('should not have an immutability field', () => {
      const hasImmutableField = RubrikPlatform.fields.some((f) => f.name === 'enableImmutableBackup');
      expect(hasImmutableField).toBe(false);
    });

    it('should have account, IAM user, and bucket fields', () => {
      const fieldNames = RubrikPlatform.fields.map((f) => f.name);
      expect(fieldNames).toContain('accountName');
      expect(fieldNames).toContain('IAMUserName');
      expect(fieldNames).toContain('buckets');
    });
  });
});
