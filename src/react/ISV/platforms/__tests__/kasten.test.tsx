import { KastenPlatform } from '../kasten';

describe('KastenPlatform', () => {
  describe('basic properties', () => {
    it('should have correct id', () => {
      expect(KastenPlatform.id).toBe('kasten');
    });

    it('should have correct name', () => {
      expect(KastenPlatform.name).toBe('Kasten');
    });

    it('should have logo', () => {
      expect(KastenPlatform.logo).toBeDefined();
    });

    it('should have policy hook', () => {
      expect(KastenPlatform.getPolicy).toBeDefined();
    });

    it('should have bucketTag defaulting to name', () => {
      expect(KastenPlatform.bucketTag).toBe('Kasten');
    });
  });

  describe('generated fields', () => {
    it('should generate accountName field', () => {
      const accountField = KastenPlatform.fields.find(
        (f) => f.name === 'accountName',
      );
      expect(accountField).toBeDefined();
      expect(accountField?.type).toBe('accountSelector');
    });

    it('should generate buckets field', () => {
      const bucketsField = KastenPlatform.fields.find(
        (f) => f.name === 'buckets',
      );
      expect(bucketsField).toBeDefined();
      expect(bucketsField?.type).toBe('bucketArray');
    });

    it('should generate IAMUserName field', () => {
      const iamField = KastenPlatform.fields.find(
        (f) => f.name === 'IAMUserName',
      );
      expect(iamField).toBeDefined();
      expect(iamField?.type).toBe('iamUserSelector');
    });

    it('should generate enableImmutableBackup field with correct override', () => {
      const immutableField = KastenPlatform.fields.find(
        (f) => f.name === 'enableImmutableBackup',
      );
      expect(immutableField).toBeDefined();
      expect(immutableField?.type).toBe('toggle');
      expect(immutableField?.label).toBe('Immutable Backup');
    });

    it('should have correct field order', () => {
      const fieldNames = KastenPlatform.fields.map((f) => f.name);
      expect(fieldNames).toEqual([
        'accountName',
        'IAMUserName',
        'buckets',
        'enableImmutableBackup',
      ]);
    });
  });

  describe('generated validator', () => {
    it('should have validator', () => {
      expect(KastenPlatform.validator).toBeDefined();
    });

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

  describe('generated mutations', () => {
    it('should generate mutations', () => {
      expect(KastenPlatform.mutations).toBeDefined();
      expect(KastenPlatform.mutations.length).toBeGreaterThan(0);
    });

    it('should include createAccount mutation', () => {
      const createAccountMutation = KastenPlatform.mutations.find(
        (m) => 'action' in m && m.action === 'createAccount',
      );
      expect(createAccountMutation).toBeDefined();
    });

    it('should include bucket loop mutation', () => {
      const bucketLoopMutation = KastenPlatform.mutations.find(
        (m) => 'each' in m && m.each === 'buckets',
      );
      expect(bucketLoopMutation).toBeDefined();
    });

    it('should include IAM mutations', () => {
      const iamMutations = KastenPlatform.mutations.filter(
        (m) =>
          'action' in m &&
          (m.action === 'createIAMUser' ||
            m.action === 'createAccessKey' ||
            m.action === 'attachPolicy'),
      );
      expect(iamMutations.length).toBeGreaterThan(0);
    });

    it('should NOT include SOS API mutation (not enabled for Kasten)', () => {
      const sosMutation = KastenPlatform.mutations.find(
        (m) => 'action' in m && m.action === 'enableSOSAPI',
      );
      expect(sosMutation).toBeUndefined();
    });
  });

  describe('summary config', () => {
    it('should have correct service endpoint label', () => {
      expect(KastenPlatform.summary.serviceEndpointLabel).toBe('S3 Endpoint');
    });

    it('should have correct immutability label', () => {
      expect(KastenPlatform.summary.immutabilityLabel).toBe('Immutable Backup');
    });
  });

  describe('policy generation', () => {
    it('should generate valid policy for buckets', () => {
      const policy = KastenPlatform.getPolicy(['bucket1', 'bucket2'], false);
      const parsed = JSON.parse(policy);

      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(2);
      expect(parsed.Statement[0].Sid).toBe('SecureBucketPolicy0');
      expect(parsed.Statement[1].Sid).toBe('SecureBucketPolicy1');
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

      expect(parsed.Statement[0].Sid).toBe('VisualEditor0');
      expect(parsed.Statement[1].Sid).toBe('VisualEditor1');

      const actions = parsed.Statement[0].Action;
      expect(actions).toContain('s3:PutObjectRetention');
      expect(actions).toContain('s3:GetObjectRetention');
      expect(actions).toContain('s3:GetBucketObjectLockConfiguration');
      expect(actions).toContain('s3:GetObjectLegalHold');
      expect(actions).toContain('s3:PutObjectLegalHold');
    });
  });
});
