import { GET_RUBRIK_POLICY } from '../../utils/ISVPolicy';
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
    it('should use the Rubrik least-privilege policy', () => {
      expect(RubrikPlatform.getPolicy(['bucket1', 'bucket2'], true)).toBe(
        GET_RUBRIK_POLICY(['bucket1', 'bucket2'], true),
      );
      expect(RubrikPlatform.getPolicy(['bucket1', 'bucket2'], false)).toBe(
        GET_RUBRIK_POLICY(['bucket1', 'bucket2'], false),
      );
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
