import { RubrikPlatform } from '../rubrik';

describe('RubrikPlatform', () => {
  describe('validator', () => {
    it('should validate correct data for new account', () => {
      const validData = {
        accountName: 'test-account',
        accountNameType: 'create',
        buckets: [{ name: 'test-rubrik-0' }],
        enableImmutableBackup: true,
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
        enableImmutableBackup: false,
      };

      const { error } = RubrikPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should require enableImmutableBackup', () => {
      const invalidData = {
        accountName: 'test-account',
        accountNameType: 'create',
        buckets: [{ name: 'test-rubrik-0' }],
        // enableImmutableBackup intentionally absent
      };

      const { error } = RubrikPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject invalid bucket name', () => {
      const invalidData = {
        accountName: 'test-account',
        accountNameType: 'create',
        buckets: [{ name: 'INVALID_BUCKET' }],
        enableImmutableBackup: true,
      };

      const { error } = RubrikPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject bucket name without rubrik suffix', () => {
      const invalidData = {
        accountName: 'test-account',
        accountNameType: 'create',
        buckets: [{ name: 'valid-bucket' }],
        enableImmutableBackup: true,
      };

      const { error } = RubrikPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject missing account name', () => {
      const invalidData = {
        accountNameType: 'create',
        buckets: [{ name: 'valid-rubrik-0' }],
        enableImmutableBackup: true,
      };

      const { error } = RubrikPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('policy generation', () => {
    it('should generate non-immutable policy with 2 statements', () => {
      const policy = RubrikPlatform.getPolicy(['my-archive-rubrik-0'], false);
      const parsed = JSON.parse(policy);

      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(2);
      expect(parsed.Statement[0].Sid).toBe('RubrikPolicy');
      expect(parsed.Statement[1].Sid).toBe('RubrikListBuckets');
    });

    it('should include all defaultActions and Rubrik-specific actions in non-immutable statement 0', () => {
      const policy = RubrikPlatform.getPolicy(['bucket1'], false);
      const parsed = JSON.parse(policy);
      const actions = parsed.Statement[0].Action;

      expect(actions).toContain('s3:GetObject');
      expect(actions).toContain('s3:PutObject');
      expect(actions).toContain('s3:DeleteObject');
      expect(actions).toContain('s3:GetBucketLocation');
      expect(actions).toContain('s3:GetBucketVersioning');
      expect(actions).toContain('s3:GetBucketObjectLockConfiguration');
      expect(actions).toContain('s3:AbortMultipartUpload');
      expect(actions).toContain('s3:ListMultipartUploadParts');
      expect(actions).toContain('s3:ListBucketMultipartUploads');
      expect(actions).toContain('s3:RestoreObject');
      expect(actions).toContain('s3:CreateBucket');
      expect(actions).toContain('s3:GetBucketAcl');
    });

    it('should scope non-immutable statement 0 resources to bucket/* and bucket ARN', () => {
      const policy = RubrikPlatform.getPolicy(['my-archive-rubrik-0'], false);
      const parsed = JSON.parse(policy);
      const resources = parsed.Statement[0].Resource;

      expect(resources).toContain('arn:aws:s3:::my-archive-rubrik-0/*');
      expect(resources).toContain('arn:aws:s3:::my-archive-rubrik-0');
    });

    it('should have ListAllMyBuckets and ListBucket on * in non-immutable statement 1', () => {
      const policy = RubrikPlatform.getPolicy(['bucket1'], false);
      const parsed = JSON.parse(policy);
      const stmt1 = parsed.Statement[1];

      expect(stmt1.Action).toContain('s3:ListAllMyBuckets');
      expect(stmt1.Action).toContain('s3:ListBucket');
      expect(stmt1.Resource).toBe('*');
    });

    it('should generate immutable policy with 3 statements', () => {
      const policy = RubrikPlatform.getPolicy(['my-archive-rubrik-0'], true);
      const parsed = JSON.parse(policy);

      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(3);
      expect(parsed.Statement[0].Sid).toBe('GlobalPermission');
      expect(parsed.Statement[1].Sid).toBe('BucketLevel');
      expect(parsed.Statement[2].Sid).toBe('ObjectLevel');
    });

    it('should have ListAllMyBuckets on * in immutable GlobalPermission', () => {
      const policy = RubrikPlatform.getPolicy(['bucket1'], true);
      const parsed = JSON.parse(policy);
      const stmt0 = parsed.Statement[0];

      expect(stmt0.Action).toEqual(['s3:ListAllMyBuckets']);
      expect(stmt0.Resource).toBe('*');
    });

    it('should include PutBucketObjectLockConfiguration in immutable BucketLevel', () => {
      const policy = RubrikPlatform.getPolicy(['bucket1'], true);
      const parsed = JSON.parse(policy);
      const actions = parsed.Statement[1].Action;

      expect(actions).toContain('s3:GetBucketObjectLockConfiguration');
      expect(actions).toContain('s3:PutBucketObjectLockConfiguration');
      expect(actions).toContain('s3:GetBucketVersioning');
      expect(actions).toContain('s3:GetBucketPolicy');
      expect(actions).toContain('s3:GetBucketPublicAccessBlock');
    });

    it('should scope immutable BucketLevel resources to bucket ARN only (no wildcard)', () => {
      const policy = RubrikPlatform.getPolicy(['my-archive-rubrik-0'], true);
      const parsed = JSON.parse(policy);
      const resources = parsed.Statement[1].Resource;

      expect(resources).toContain('arn:aws:s3:::my-archive-rubrik-0');
      expect(resources).not.toContain('arn:aws:s3:::my-archive-rubrik-0/*');
    });

    it('should include Object Lock and versioning actions in immutable ObjectLevel', () => {
      const policy = RubrikPlatform.getPolicy(['bucket1'], true);
      const parsed = JSON.parse(policy);
      const actions = parsed.Statement[2].Action;

      expect(actions).toContain('s3:GetObjectVersion');
      expect(actions).toContain('s3:DeleteObjectVersion');
      expect(actions).toContain('s3:GetObjectVersionTagging');
      expect(actions).toContain('s3:PutObjectVersionTagging');
      expect(actions).toContain('s3:PutObjectRetention');
      expect(actions).toContain('s3:GetObjectRetention');
      expect(actions).toContain('s3:PutObjectLegalHold');
      expect(actions).toContain('s3:GetObjectLegalHold');
      expect(actions).toContain('s3:BypassGovernanceRetention');
    });

    it('should scope immutable ObjectLevel resources to bucket/* only', () => {
      const policy = RubrikPlatform.getPolicy(['my-archive-rubrik-0'], true);
      const parsed = JSON.parse(policy);
      const resources = parsed.Statement[2].Resource;

      expect(resources).toContain('arn:aws:s3:::my-archive-rubrik-0/*');
      expect(resources).not.toContain('arn:aws:s3:::my-archive-rubrik-0');
    });

    it('should include resources for multiple buckets in immutable policy', () => {
      const policy = RubrikPlatform.getPolicy(['bucket1', 'bucket2'], true);
      const parsed = JSON.parse(policy);

      expect(parsed.Statement[1].Resource).toContain('arn:aws:s3:::bucket1');
      expect(parsed.Statement[1].Resource).toContain('arn:aws:s3:::bucket2');
      expect(parsed.Statement[2].Resource).toContain('arn:aws:s3:::bucket1/*');
      expect(parsed.Statement[2].Resource).toContain('arn:aws:s3:::bucket2/*');
    });

    it('should include resources for multiple buckets in non-immutable policy', () => {
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

    it('should have an immutability field', () => {
      const hasImmutableField = RubrikPlatform.fields.some((f) => f.name === 'enableImmutableBackup');
      expect(hasImmutableField).toBe(true);
    });

    it('should have account, IAM user, and bucket fields', () => {
      const fieldNames = RubrikPlatform.fields.map((f) => f.name);
      expect(fieldNames).toContain('accountName');
      expect(fieldNames).toContain('IAMUserName');
      expect(fieldNames).toContain('buckets');
    });
  });
});
