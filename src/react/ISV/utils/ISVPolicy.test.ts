import {
  defaultActions,
  GET_COMMVAULT_POLICY,
  GET_VEEAM_POLICY,
  immutableActions,
} from './ISVPolicy';

describe('ISVPolicy', () => {
  const testBuckets = ['test-bucket-1', 'test-bucket-2'];

  describe('GET_VEEAM_POLICY', () => {
    it('should generate the correct immutable policy', () => {
      const policy = GET_VEEAM_POLICY(testBuckets, true);
      const parsedPolicy = JSON.parse(policy);

      expect(parsedPolicy.Version).toBe('2012-10-17');
      expect(parsedPolicy.Statement).toHaveLength(2);

      // Check Sid values
      expect(parsedPolicy.Statement[0].Sid).toBe('VisualEditor0');
      expect(parsedPolicy.Statement[1].Sid).toBe('VisualEditor1');

      // Check resources
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[0]}`,
      );
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[0]}/*`,
      );
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[1]}`,
      );
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[1]}/*`,
      );
    });

    it('should generate the correct non-immutable policy', () => {
      const policy = GET_VEEAM_POLICY(testBuckets, false);
      const parsedPolicy = JSON.parse(policy);

      expect(parsedPolicy.Version).toBe('2012-10-17');
      expect(parsedPolicy.Statement).toHaveLength(2);

      // Check Sid values
      expect(parsedPolicy.Statement[0].Sid).toBe('SecureBucketPolicy0');
      expect(parsedPolicy.Statement[1].Sid).toBe('SecureBucketPolicy1');

      // Check resources
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[0]}`,
      );
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[0]}/*`,
      );
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[1]}`,
      );
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[1]}/*`,
      );

      // Check that immutable-specific actions are not included
      expect(parsedPolicy.Statement[0].Action).not.toContain(
        's3:PutObjectRetention',
      );
      expect(parsedPolicy.Statement[0].Action).not.toContain(
        's3:PutObjectLegalHold',
      );
      expect(parsedPolicy.Statement[0].Action).not.toContain(
        's3:GetObjectRetention',
      );
      expect(parsedPolicy.Statement[0].Action).not.toContain(
        's3:GetObjectLegalHold',
      );
    });
  });

  describe('GET_COMMVAULT_POLICY', () => {
    it('should return correct Commvault policy', () => {
      const commvaultPolicy = GET_COMMVAULT_POLICY(testBuckets, true);
      const parsedPolicy = JSON.parse(commvaultPolicy);

      expect(parsedPolicy.Version).toBe('2012-10-17');
      expect(parsedPolicy.Statement).toHaveLength(2);

      // Commvault policy doesn't have Sid values
      expect(parsedPolicy.Statement[0].Sid).toBeUndefined();
      expect(parsedPolicy.Statement[1].Sid).toBeUndefined();

      // Check resources
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[0]}`,
      );
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[0]}/*`,
      );
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[1]}`,
      );
      expect(parsedPolicy.Statement[0].Resource).toContain(
        `arn:aws:s3:::${testBuckets[1]}/*`,
      );
    });
  });

  describe('getAllowedActions', () => {
    it('should include immutable-specific actions when isImmutable is true', () => {
      const immutablePolicy = GET_VEEAM_POLICY(testBuckets, true);
      const parsedPolicy = JSON.parse(immutablePolicy);

      immutableActions.forEach((action) => {
        expect(parsedPolicy.Statement[0].Action).toContain(action);
      });
    });

    it('should not include immutable-specific actions when isImmutable is false', () => {
      const nonImmutablePolicy = GET_VEEAM_POLICY(testBuckets, false);
      const parsedPolicy = JSON.parse(nonImmutablePolicy);

      immutableActions.forEach((action) => {
        expect(parsedPolicy.Statement[0].Action).not.toContain(action);
      });
    });

    it('should include common actions regardless of immutability', () => {
      const immutablePolicy = JSON.parse(GET_VEEAM_POLICY(testBuckets, true));
      const nonImmutablePolicy = JSON.parse(
        GET_VEEAM_POLICY(testBuckets, false),
      );

      const commonActions = defaultActions;

      commonActions.forEach((action) => {
        expect(immutablePolicy.Statement[0].Action).toContain(action);
        expect(nonImmutablePolicy.Statement[0].Action).toContain(action);
      });
    });
  });
});
