import { VeeamVBRPlatform } from '../veeam-vbr';
import { VEEAM_BACKUP_REPLICATION } from '../../constants';

describe('VeeamVBRPlatform', () => {
  describe('basic properties', () => {
    it('should have correct id', () => {
      expect(VeeamVBRPlatform.id).toBe('veeam-vbr');
    });

    it('should have correct name', () => {
      expect(VeeamVBRPlatform.name).toBe('Veeam');
    });

    it('should have logo', () => {
      expect(VeeamVBRPlatform.logo).toBeDefined();
    });

    it('should have policy hook', () => {
      expect(VeeamVBRPlatform.getPolicy).toBeDefined();
      expect(typeof VeeamVBRPlatform.getPolicy).toBe('function');
    });

    it('should have correct bucketTag', () => {
      expect(VeeamVBRPlatform.bucketTag).toBe(VEEAM_BACKUP_REPLICATION);
    });
  });

  describe('generated fields', () => {
    it('should generate accountName field', () => {
      const accountField = VeeamVBRPlatform.fields.find(
        (f) => f.name === 'accountName',
      );
      expect(accountField).toBeDefined();
      expect(accountField?.type).toBe('accountSelector');
      expect(accountField?.label).toBe('Account');
    });

    it('should generate buckets field with capacity itemFields', () => {
      const bucketsField = VeeamVBRPlatform.fields.find(
        (f) => f.name === 'buckets',
      );
      expect(bucketsField).toBeDefined();
      expect(bucketsField?.type).toBe('bucketArray');

      if (bucketsField && 'itemFields' in bucketsField) {
        const capacityField = bucketsField.itemFields.find(
          (f) => f.name === 'capacity',
        );
        expect(capacityField).toBeDefined();
        expect(capacityField?.type).toBe('number');

        const capacityUnitField = bucketsField.itemFields.find(
          (f) => f.name === 'capacityUnit',
        );
        expect(capacityUnitField).toBeDefined();
        expect(capacityUnitField?.type).toBe('select');
      }
    });

    it('should generate IAMUserName field', () => {
      const iamField = VeeamVBRPlatform.fields.find(
        (f) => f.name === 'IAMUserName',
      );
      expect(iamField).toBeDefined();
      expect(iamField?.type).toBe('iamUserSelector');
    });

    it('should generate enableImmutableBackup field', () => {
      const immutableField = VeeamVBRPlatform.fields.find(
        (f) => f.name === 'enableImmutableBackup',
      );
      expect(immutableField).toBeDefined();
      expect(immutableField?.type).toBe('toggle');
      expect(immutableField?.label).toBe('Immutable Backup');
    });
  });

  describe('generated validator', () => {
    it('should have validator', () => {
      expect(VeeamVBRPlatform.validator).toBeDefined();
    });

    it('should validate correct data with capacity', () => {
      const validData = {
        accountName: 'test-account',
        accountNameType: 'create',
        enableImmutableBackup: false,
        buckets: [
          {
            name: 'test-bucket',
            capacity: 100,
            capacityUnit: 'GiB',
          },
        ],
      };

      const { error } = VeeamVBRPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject bucket without capacity (for VBR)', () => {
      const invalidData = {
        accountName: 'test-account',
        accountNameType: 'create',
        enableImmutableBackup: false,
        buckets: [{ name: 'test-bucket' }],
      };

      const { error } = VeeamVBRPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should validate existing account with IAM user', () => {
      const validData = {
        accountName: 'existing-account',
        accountNameType: 'existing',
        IAMUserName: 'test-iam-user',
        IAMUserNameType: 'create',
        generateKey: true,
        enableImmutableBackup: true,
        buckets: [
          {
            name: 'bucket-one',
            capacity: 500,
            capacityUnit: 'TiB',
          },
        ],
      };

      const { error } = VeeamVBRPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate autoCreateRepository and immutablePeriodDays', () => {
      const validData = {
        accountName: 'test-account',
        accountNameType: 'create',
        enableImmutableBackup: true,
        autoCreateRepository: true,
        immutablePeriodDays: 30,
        buckets: [
          {
            name: 'test-bucket',
            capacity: 100,
            capacityUnit: 'GiB',
          },
        ],
      };

      const { error } = VeeamVBRPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should require immutablePeriodDays when autoCreateRepository and enableImmutableBackup are true', () => {
      const invalidData = {
        accountName: 'test-account',
        accountNameType: 'create',
        enableImmutableBackup: true,
        autoCreateRepository: true,
        buckets: [
          {
            name: 'test-bucket',
            capacity: 100,
            capacityUnit: 'GiB',
          },
        ],
      };

      const { error } = VeeamVBRPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.message).toContain('immutablePeriodDays');
    });

    it('should not require immutablePeriodDays when autoCreateRepository is false', () => {
      const validData = {
        accountName: 'test-account',
        accountNameType: 'create',
        enableImmutableBackup: true,
        autoCreateRepository: false,
        buckets: [
          {
            name: 'test-bucket',
            capacity: 100,
            capacityUnit: 'GiB',
          },
        ],
      };

      const { error } = VeeamVBRPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });
  });

  describe('generated mutations', () => {
    it('should generate mutations', () => {
      expect(VeeamVBRPlatform.mutations).toBeDefined();
      expect(VeeamVBRPlatform.mutations.length).toBeGreaterThan(0);
    });

    it('should include enableSOSAPI mutation (sosAPI: true)', () => {
      const sosMutation = VeeamVBRPlatform.mutations.find(
        (m) => 'action' in m && m.action === 'enableSOSAPI',
      );
      expect(sosMutation).toBeDefined();
    });

    it('should include createAccount mutation', () => {
      const createAccountMutation = VeeamVBRPlatform.mutations.find(
        (m) => 'action' in m && m.action === 'createAccount',
      );
      expect(createAccountMutation).toBeDefined();
    });

    it('should include bucket loop mutation with perBucketSteps', () => {
      const loopMutation = VeeamVBRPlatform.mutations.find(
        (m) => 'each' in m && m.each === 'buckets',
      );
      expect(loopMutation).toBeDefined();

      if (loopMutation && 'steps' in loopMutation) {
        const stepIds = loopMutation.steps.map((s) => s.id);

        expect(stepIds).toContain('createBucket');
        expect(stepIds).toContain('tagBucket');
        expect(stepIds).toContain('veeamFolder');
        expect(stepIds).toContain('veeamSystem');
        expect(stepIds).toContain('veeamCapacity');
      }
    });

    it('should have perBucketSteps with putObject action', () => {
      const loopMutation = VeeamVBRPlatform.mutations.find(
        (m) => 'each' in m && m.each === 'buckets',
      );

      if (loopMutation && 'steps' in loopMutation) {
        const veeamSystemStep = loopMutation.steps.find(
          (s) => s.id === 'veeamSystem',
        );
        expect(veeamSystemStep).toBeDefined();
        expect(veeamSystemStep?.action).toBe('putObject');

        const veeamCapacityStep = loopMutation.steps.find(
          (s) => s.id === 'veeamCapacity',
        );
        expect(veeamCapacityStep).toBeDefined();
        expect(veeamCapacityStep?.action).toBe('putObject');
      }
    });

    it('should include IAM mutations', () => {
      const iamMutations = VeeamVBRPlatform.mutations.filter(
        (m) =>
          'action' in m &&
          [
            'createIAMUser',
            'createAccessKey',
            'createPolicy',
            'attachPolicy',
          ].includes(m.action),
      );
      expect(iamMutations.length).toBeGreaterThan(0);
    });
  });

  describe('perBucketSteps variables', () => {
    it('veeamSystem step should include correct variables', () => {
      const loopMutation = VeeamVBRPlatform.mutations.find(
        (m) => 'each' in m && m.each === 'buckets',
      );

      if (loopMutation && 'steps' in loopMutation) {
        const veeamSystemStep = loopMutation.steps.find(
          (s) => s.id === 'veeamSystem',
        );

        const mockForm = {
          accountName: 'test',
          accountNameType: 'create' as const,
          enableImmutableBackup: false,
          buckets: [],
        };
        const mockBucket = { name: 'test-bucket', capacityBytes: 1024 };
        const mockPrev = { assumeRole: { data: {} } };
        const mockCtx = {
          _sosApiStatus: 'activated' as const,
          _existingAccount: null,
          _platformId: 'veeam-vbr',
          _bucketTag: VEEAM_BACKUP_REPLICATION,
          _instanceId: 'test-instance-id',
          isNewAccount: true,
          needsIAMUser: true,
          needsAccessKey: true,
          _s3ServicePoint: 'test-s3-service-point',
        };

        const variables = veeamSystemStep?.variables(
          mockForm,
          mockBucket,
          mockPrev,
          mockCtx,
        );

        // data-browser-library hooks get s3Client from context, not from variables
        expect(variables).not.toHaveProperty('s3Client');
        expect(variables).toHaveProperty('Bucket', 'test-bucket');
        expect(variables).toHaveProperty('ContentType', 'text/xml');
      }
    });

    it('veeamCapacity step should use bucket.capacityBytes', () => {
      const loopMutation = VeeamVBRPlatform.mutations.find(
        (m) => 'each' in m && m.each === 'buckets',
      );

      if (loopMutation && 'steps' in loopMutation) {
        const veeamCapacityStep = loopMutation.steps.find(
          (s) => s.id === 'veeamCapacity',
        );

        const mockForm = {
          accountName: 'test',
          accountNameType: 'create' as const,
          enableImmutableBackup: false,
          buckets: [],
        };
        const mockBucket = {
          name: 'capacity-bucket',
          capacityBytes: 1099511627776,
        };
        const mockPrev = { assumeRole: { data: {} } };
        const mockCtx = {
          _sosApiStatus: 'activated' as const,
          _existingAccount: null,
          _platformId: 'veeam-vbr',
          _bucketTag: VEEAM_BACKUP_REPLICATION,
          _instanceId: 'test-instance-id',
          isNewAccount: true,
          needsIAMUser: true,
          needsAccessKey: true,
          _s3ServicePoint: 'test-s3-service-point',
        };

        const variables = veeamCapacityStep?.variables(
          mockForm,
          mockBucket,
          mockPrev,
          mockCtx,
        );

        expect(variables).toHaveProperty('Bucket', 'capacity-bucket');
        expect(variables?.Body).toContain('1099511627776');
      }
    });
  });

  describe('summary config', () => {
    it('should have bucketBanner', () => {
      expect(VeeamVBRPlatform.summary.bucketBanner).toBeDefined();
    });

    it('should have immutabilityHelpText function', () => {
      expect(VeeamVBRPlatform.summary.immutabilityHelpText).toBeDefined();
      expect(typeof VeeamVBRPlatform.summary.immutabilityHelpText).toBe(
        'function',
      );
    });

    it('should return help text when immutable is true', () => {
      const helpText = VeeamVBRPlatform.summary.immutabilityHelpText?.(true);
      expect(helpText).toContain('Make recent backups immutable');
    });

    it('should return undefined when immutable is false', () => {
      const helpText = VeeamVBRPlatform.summary.immutabilityHelpText?.(false);
      expect(helpText).toBeUndefined();
    });
  });

  describe('policy generation', () => {
    it('should generate valid policy for buckets', () => {
      const policy = VeeamVBRPlatform.getPolicy(['bucket1', 'bucket2'], false);
      const parsed = JSON.parse(policy);

      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(2);
      expect(parsed.Statement[0].Resource).toContain('arn:aws:s3:::bucket1');
      expect(parsed.Statement[0].Resource).toContain('arn:aws:s3:::bucket2');
    });

    it('should include immutable actions when immutable is true', () => {
      const policy = VeeamVBRPlatform.getPolicy(['bucket1'], true);
      const parsed = JSON.parse(policy);

      expect(parsed.Statement[0].Action).toContain('s3:PutObjectRetention');
      expect(parsed.Statement[0].Action).toContain('s3:GetObjectLegalHold');
    });
  });
});
