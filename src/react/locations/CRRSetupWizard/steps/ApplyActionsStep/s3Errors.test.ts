import { isBucketAlreadyOwned, s3ErrorMessage } from './s3Errors';

const s3Error = (name: string, message = 'raw sdk text') => Object.assign(new Error(message), { name });

describe('CRR wizard — S3 error handling', () => {
  describe('isBucketAlreadyOwned', () => {
    it('recognises the bucket the caller already owns', () => {
      expect(isBucketAlreadyOwned(s3Error('BucketAlreadyOwnedByYou'))).toBe(true);
    });

    it('recognises it when the code is only on the wrapped AWS error', () => {
      expect(
        isBucketAlreadyOwned({ name: 'EnhancedS3Error', originalError: { name: 'BucketAlreadyOwnedByYou' } }),
      ).toBe(true);
    });

    it('does not confuse it with a name taken by another account', () => {
      expect(isBucketAlreadyOwned(s3Error('BucketAlreadyExists'))).toBe(false);
    });

    it('tolerates a missing error', () => {
      expect(isBucketAlreadyOwned(undefined)).toBe(false);
    });
  });

  describe('s3ErrorMessage', () => {
    it('explains a name taken by another account, and how to move on', () => {
      expect(s3ErrorMessage(s3Error('BucketAlreadyExists'), 'my-bucket')).toBe(
        'The bucket name "my-bucket" is already taken by another account. Choose a different name.',
      );
    });

    it('explains a permission failure without SDK wording', () => {
      expect(s3ErrorMessage(s3Error('AccessDenied'))).toBe(
        'You are not authorized to perform this operation. Check the account permissions.',
      );
    });

    it('falls back to the original message for unmapped codes', () => {
      expect(s3ErrorMessage(s3Error('SlowDown', 'Please reduce your request rate.'))).toBe(
        'Please reduce your request rate.',
      );
    });

    it('returns nothing when there is no error', () => {
      expect(s3ErrorMessage(undefined)).toBeUndefined();
    });
  });
});
