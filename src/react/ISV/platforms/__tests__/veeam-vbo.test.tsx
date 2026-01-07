import { VeeamVBOPlatform } from '../veeam-vbo';
import { VEEAM_OFFICE_365, VEEAM_OFFICE_365_V8 } from '../../constants';
import { VEEAM_VBO_APPLICATION } from '../../constants';

describe('VeeamVBOPlatform', () => {
  describe('basic properties', () => {
    it('should have correct id', () => {
      expect(VeeamVBOPlatform.id).toBe('veeam-vbo');
    });

    it('should have correct name', () => {
      expect(VeeamVBOPlatform.name).toBe('Veeam VB365');
    });

    it('should have logo', () => {
      expect(VeeamVBOPlatform.logo).toBeDefined();
    });

    it('should have policy hook', () => {
      expect(VeeamVBOPlatform.getPolicy).toBeDefined();
      expect(typeof VeeamVBOPlatform.getPolicy).toBe('function');
    });

    it('should have correct bucketTag', () => {
      expect(VeeamVBOPlatform.bucketTag).toBe(VEEAM_VBO_APPLICATION);
    });
  });

  describe('generated fields', () => {
    it('should generate accountName field', () => {
      const accountField = VeeamVBOPlatform.fields.find(
        (f) => f.name === 'accountName'
      );
      expect(accountField).toBeDefined();
      expect(accountField?.type).toBe('accountSelector');
      expect(accountField?.label).toBe('Account');
    });

    it('should generate application field after account', () => {
      const appField = VeeamVBOPlatform.fields.find(
        (f) => f.name === 'application'
      );
      expect(appField).toBeDefined();
      expect(appField?.type).toBe('select');
      expect(appField?.label).toBe('Veeam application');

      if (appField && 'options' in appField) {
        expect(appField.options).toHaveLength(2);
        expect(appField.options[0].value).toBe(VEEAM_OFFICE_365);
        expect(appField.options[1].value).toBe(VEEAM_OFFICE_365_V8);
      }

      // Verify application field comes after accountName in field order
      const fieldNames = VeeamVBOPlatform.fields.map((f) => f.name);
      const accountIndex = fieldNames.indexOf('accountName');
      const appIndex = fieldNames.indexOf('application');
      expect(appIndex).toBeGreaterThan(accountIndex);
    });

    it('should generate buckets field without capacity', () => {
      const bucketsField = VeeamVBOPlatform.fields.find(
        (f) => f.name === 'buckets'
      );
      expect(bucketsField).toBeDefined();
      expect(bucketsField?.type).toBe('bucketArray');

      if (bucketsField && 'itemFields' in bucketsField) {
        const capacityField = bucketsField.itemFields.find(
          (f) => f.name === 'capacity'
        );
        expect(capacityField).toBeUndefined();
      }
    });

    it('should generate enableImmutableBackup field with showWhen', () => {
      const immutableField = VeeamVBOPlatform.fields.find(
        (f) => f.name === 'enableImmutableBackup'
      );
      expect(immutableField).toBeDefined();
      expect(immutableField?.type).toBe('toggle');

      if (immutableField && 'showWhen' in immutableField) {
        const mockFormV6V7 = {
          application: VEEAM_OFFICE_365,
          accountName: 'test',
          accountNameType: 'create' as const,
          enableImmutableBackup: false,
          buckets: [],
        };
        const mockFormV8 = {
          application: VEEAM_OFFICE_365_V8,
          accountName: 'test',
          accountNameType: 'create' as const,
          enableImmutableBackup: false,
          buckets: [],
        };

        expect(immutableField.showWhen?.(mockFormV6V7)).toBe(false);
        expect(immutableField.showWhen?.(mockFormV8)).toBe(true);
      }
    });

    it('should generate IAMUserName field', () => {
      const iamField = VeeamVBOPlatform.fields.find(
        (f) => f.name === 'IAMUserName'
      );
      expect(iamField).toBeDefined();
      expect(iamField?.type).toBe('iamUserSelector');
    });
  });

  describe('generated validator', () => {
    it('should have validator', () => {
      expect(VeeamVBOPlatform.validator).toBeDefined();
    });

    it('should require application field', () => {
      const invalidData = {
        accountName: 'test-account',
        accountNameType: 'create',
        buckets: [{ name: 'test-bucket' }],
      };

      const { error } = VeeamVBOPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.message).toContain('application');
    });

    it('should validate v6/v7 without enableImmutableBackup', () => {
      const validData = {
        accountName: 'test-account',
        accountNameType: 'create',
        application: VEEAM_OFFICE_365,
        buckets: [{ name: 'test-bucket' }],
      };

      const { error } = VeeamVBOPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should require enableImmutableBackup for v8+', () => {
      const invalidData = {
        accountName: 'test-account',
        accountNameType: 'create',
        application: VEEAM_OFFICE_365_V8,
        buckets: [{ name: 'test-bucket' }],
      };

      const { error } = VeeamVBOPlatform.validator.validate(invalidData);
      expect(error).toBeDefined();
      expect(error?.message).toContain('enableImmutableBackup');
    });

    it('should validate v8+ with enableImmutableBackup', () => {
      const validData = {
        accountName: 'test-account',
        accountNameType: 'create',
        application: VEEAM_OFFICE_365_V8,
        enableImmutableBackup: true,
        buckets: [{ name: 'test-bucket' }],
      };

      const { error } = VeeamVBOPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate existing account with IAM user', () => {
      const validData = {
        accountName: 'existing-account',
        accountNameType: 'existing',
        IAMUserName: 'test-iam-user',
        IAMUserNameType: 'create',
        generateKey: true,
        application: VEEAM_OFFICE_365_V8,
        enableImmutableBackup: false,
        buckets: [{ name: 'bucket-one' }],
      };

      const { error } = VeeamVBOPlatform.validator.validate(validData);
      expect(error).toBeUndefined();
    });
  });

  describe('generated mutations', () => {
    it('should generate mutations', () => {
      expect(VeeamVBOPlatform.mutations).toBeDefined();
      expect(VeeamVBOPlatform.mutations.length).toBeGreaterThan(0);
    });

    it('should NOT include enableSOSAPI mutation (no sosAPI)', () => {
      const sosMutation = VeeamVBOPlatform.mutations.find(
        (m) => 'action' in m && m.action === 'enableSOSAPI'
      );
      expect(sosMutation).toBeUndefined();
    });

    it('should include createAccount mutation', () => {
      const createAccountMutation = VeeamVBOPlatform.mutations.find(
        (m) => 'action' in m && m.action === 'createAccount'
      );
      expect(createAccountMutation).toBeDefined();
    });

    it('should include bucket loop mutation with only standard steps', () => {
      const loopMutation = VeeamVBOPlatform.mutations.find(
        (m) => 'each' in m && m.each === 'buckets'
      );
      expect(loopMutation).toBeDefined();

      if (loopMutation && 'steps' in loopMutation) {
        const stepIds = loopMutation.steps.map((s) => s.id);

        expect(stepIds).toContain('createBucket');
        expect(stepIds).toContain('tagBucket');
        expect(stepIds).not.toContain('veeamFolder');
        expect(stepIds).not.toContain('veeamSystem');
        expect(stepIds).not.toContain('veeamCapacity');
        expect(loopMutation.steps).toHaveLength(2);
      }
    });

    it('should include IAM mutations', () => {
      const iamMutations = VeeamVBOPlatform.mutations.filter(
        (m) =>
          'action' in m &&
          [
            'createIAMUser',
            'createAccessKey',
            'createPolicy',
            'attachPolicy',
          ].includes(m.action)
      );
      expect(iamMutations.length).toBeGreaterThan(0);
    });
  });

  describe('summary config', () => {
    it('should have serviceEndpointLabel', () => {
      expect(VeeamVBOPlatform.summary.serviceEndpointLabel).toBe(
        'Service Endpoint'
      );
    });

    it('should NOT have bucketBanner (VBO does not need it)', () => {
      expect(VeeamVBOPlatform.summary.bucketBanner).toBeUndefined();
    });

    it('should have immutabilityHelpText function', () => {
      expect(VeeamVBOPlatform.summary.immutability?.helpText).toBeDefined();
      expect(typeof VeeamVBOPlatform.summary.immutability?.helpText).toBe(
        'function'
      );
    });

    it('should return help text when immutable is true', () => {
      const helpText = VeeamVBOPlatform.summary.immutability?.helpText?.(true);
      expect(helpText).toContain('Make recent backups immutable');
    });

    it('should return undefined when immutable is false', () => {
      const helpText = VeeamVBOPlatform.summary.immutability?.helpText?.(false);
      expect(helpText).toBeUndefined();
    });
  });

  describe('policy generation', () => {
    it('should generate valid policy for buckets', () => {
      const policy = VeeamVBOPlatform.getPolicy(
        ['bucket1', 'bucket2'],
        false
      );
      const parsed = JSON.parse(policy);

      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(2);
      expect(parsed.Statement[0].Resource).toContain('arn:aws:s3:::bucket1');
      expect(parsed.Statement[0].Resource).toContain('arn:aws:s3:::bucket2');
    });

    it('should include immutable actions when immutable is true', () => {
      const policy = VeeamVBOPlatform.getPolicy(['bucket1'], true);
      const parsed = JSON.parse(policy);

      expect(parsed.Statement[0].Action).toContain('s3:PutObjectRetention');
      expect(parsed.Statement[0].Action).toContain('s3:GetObjectLegalHold');
    });
  });
});

