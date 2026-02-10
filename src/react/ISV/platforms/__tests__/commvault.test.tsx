import { CommvaultPlatform } from '../commvault';

describe('CommvaultPlatform', () => {
  describe('basic properties', () => {
    it('should have correct id', () => {
      expect(CommvaultPlatform.id).toBe('commvault');
    });

    it('should have correct name', () => {
      expect(CommvaultPlatform.name).toBe('Commvault');
    });

    it('should have logo', () => {
      expect(CommvaultPlatform.logo).toBeDefined();
    });

    it('should have policy hook', () => {
      expect(CommvaultPlatform.getPolicy).toBeDefined();
      expect(typeof CommvaultPlatform.getPolicy).toBe('function');
    });

    it('should have bucketTag defaulting to name', () => {
      expect(CommvaultPlatform.bucketTag).toBe('Commvault');
    });
  });

  describe('generated fields', () => {
    it('should generate accountName field', () => {
      const accountField = CommvaultPlatform.fields.find((f) => f.name === 'accountName');
      expect(accountField).toBeDefined();
      expect(accountField?.type).toBe('accountSelector');
      expect(accountField?.label).toBe('Account');
    });

    it('should generate buckets field', () => {
      const bucketsField = CommvaultPlatform.fields.find((f) => f.name === 'buckets');
      expect(bucketsField).toBeDefined();
      expect(bucketsField?.type).toBe('bucketArray');
    });

    it('should generate IAMUserName field', () => {
      const iamField = CommvaultPlatform.fields.find((f) => f.name === 'IAMUserName');
      expect(iamField).toBeDefined();
      expect(iamField?.type).toBe('iamUserSelector');
    });

    it('should generate enableImmutableBackup field with correct override', () => {
      const immutableField = CommvaultPlatform.fields.find((f) => f.name === 'enableImmutableBackup');
      expect(immutableField).toBeDefined();
      expect(immutableField?.type).toBe('toggle');
      expect(immutableField?.label).toBe('WORM bucket');
    });

    it('should have correct field order', () => {
      const fieldNames = CommvaultPlatform.fields.map((f) => f.name);
      const accountIndex = fieldNames.indexOf('accountName');
      const iamIndex = fieldNames.indexOf('IAMUserName');
      const bucketsIndex = fieldNames.indexOf('buckets');
      const immutableIndex = fieldNames.indexOf('enableImmutableBackup');

      expect(accountIndex).toBeLessThan(iamIndex);
      expect(iamIndex).toBeLessThan(bucketsIndex);
      expect(bucketsIndex).toBeLessThan(immutableIndex);
    });
  });

  describe('generated validator', () => {
    it('should have validator', () => {
      expect(CommvaultPlatform.validator).toBeDefined();
    });

    it('should validate correct data for new account', () => {
      const validData = {
        accountName: 'test-account',
        accountNameType: 'create',
        enableImmutableBackup: false,
        buckets: [{ name: 'test-bucket' }],
      };

      const { error } = CommvaultPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate correct data for existing account with IAM user', () => {
      const validData = {
        accountName: 'existing-account',
        accountNameType: 'existing',
        IAMUserName: 'test-iam-user',
        IAMUserNameType: 'create',
        generateKey: true,
        enableImmutableBackup: true,
        buckets: [{ name: 'bucket-one' }],
      };

      const { error } = CommvaultPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid bucket name', () => {
      const invalidData = {
        accountName: 'test-account',
        accountNameType: 'create',
        enableImmutableBackup: false,
        buckets: [{ name: 'Invalid_Bucket!' }],
      };

      const { error } = CommvaultPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject invalid account name', () => {
      const invalidData = {
        accountName: 'a',
        accountNameType: 'create',
        enableImmutableBackup: false,
        buckets: [{ name: 'valid-bucket' }],
      };

      const { error } = CommvaultPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should validate multiple buckets', () => {
      const validData = {
        accountName: 'test-account',
        accountNameType: 'create',
        enableImmutableBackup: false,
        buckets: [{ name: 'bucket-one' }, { name: 'bucket-two' }, { name: 'bucket-three' }],
      };

      const { error } = CommvaultPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });
  });

  describe('generated mutations', () => {
    it('should generate mutations', () => {
      expect(CommvaultPlatform.mutations).toBeDefined();
      expect(CommvaultPlatform.mutations.length).toBeGreaterThan(0);
    });

    it('should include createAccount mutation', () => {
      const createAccountMutation = CommvaultPlatform.mutations.find(
        (m) => 'action' in m && m.action === 'createAccount',
      );
      expect(createAccountMutation).toBeDefined();
    });

    it('should include bucket loop mutation', () => {
      const loopMutation = CommvaultPlatform.mutations.find((m) => 'each' in m && m.each === 'buckets');
      expect(loopMutation).toBeDefined();
      if (loopMutation && 'steps' in loopMutation) {
        const stepActions = loopMutation.steps.map((s) => s.action);
        expect(stepActions).toContain('createBucket');
        expect(stepActions).toContain('tagBucket');
      }
    });

    it('should include IAM mutations', () => {
      const iamMutations = CommvaultPlatform.mutations.filter(
        (m) => 'action' in m && ['createIAMUser', 'createAccessKey', 'createPolicy', 'attachPolicy'].includes(m.action),
      );
      expect(iamMutations.length).toBeGreaterThan(0);
    });

    it('should NOT include SOS API mutation (not enabled for Commvault)', () => {
      const sosMutation = CommvaultPlatform.mutations.find((m) => 'action' in m && m.action === 'enableSOSAPI');
      expect(sosMutation).toBeUndefined();
    });
  });

  describe('summary config', () => {
    it('should have correct service endpoint label', () => {
      expect(CommvaultPlatform.summary.serviceEndpointLabel).toBe('Service Host');
    });

    it('should have correct immutability label', () => {
      expect(CommvaultPlatform.summary.immutabilityLabel).toBe('WORM Storage lock');
    });
  });

  describe('policy generation', () => {
    it('should generate valid policy for buckets', () => {
      const policy = CommvaultPlatform.getPolicy(['bucket1', 'bucket2'], false);
      const parsed = JSON.parse(policy);

      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(2);
      expect(parsed.Statement[0].Resource).toContain('arn:aws:s3:::bucket1');
      expect(parsed.Statement[0].Resource).toContain('arn:aws:s3:::bucket2');
    });

    it('should include immutable actions when immutable is true', () => {
      const policy = CommvaultPlatform.getPolicy(['bucket1'], true);
      const parsed = JSON.parse(policy);

      expect(parsed.Statement[0].Action).toContain('s3:PutObjectRetention');
      expect(parsed.Statement[0].Action).toContain('s3:GetObjectLegalHold');
    });
  });
});
