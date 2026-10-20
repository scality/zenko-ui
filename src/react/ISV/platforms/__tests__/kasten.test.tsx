import { GET_KASTEN_POLICY } from '../../utils/ISVPolicy';
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
    it('should use the Kasten least-privilege policy', () => {
      expect(KastenPlatform.getPolicy(['bucket1', 'bucket2'], true)).toBe(
        GET_KASTEN_POLICY(['bucket1', 'bucket2'], true),
      );
      expect(KastenPlatform.getPolicy(['bucket1', 'bucket2'], false)).toBe(
        GET_KASTEN_POLICY(['bucket1', 'bucket2'], false),
      );
    });
  });
});
