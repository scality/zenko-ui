import { GET_ISV_POLICY, GET_VEEAM_POLICY } from './ISVPolicy';

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
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[0]}`);
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[0]}/*`);
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[1]}`);
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[1]}/*`);
      
      // Check immutable-specific actions
      expect(parsedPolicy.Statement[0].Action).toContain('s3:PutObjectRetention');
      expect(parsedPolicy.Statement[0].Action).toContain('s3:PutObjectLegalHold');
      expect(parsedPolicy.Statement[0].Action).toContain('s3:GetObjectRetention');
      expect(parsedPolicy.Statement[0].Action).toContain('s3:GetObjectLegalHold');
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
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[0]}`);
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[0]}/*`);
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[1]}`);
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[1]}/*`);
      
      // Check that immutable-specific actions are not included
      expect(parsedPolicy.Statement[0].Action).not.toContain('s3:PutObjectRetention');
      expect(parsedPolicy.Statement[0].Action).not.toContain('s3:PutObjectLegalHold');
      expect(parsedPolicy.Statement[0].Action).not.toContain('s3:GetObjectRetention');
      expect(parsedPolicy.Statement[0].Action).not.toContain('s3:GetObjectLegalHold');
    });
  });
  
  describe('GET_ISV_POLICY', () => {
    it('should return Veeam policy for veeam application', () => {
      const veeamPolicy = GET_ISV_POLICY(testBuckets, 'veeam', true);
      const veeamVboPolicy = GET_ISV_POLICY(testBuckets, 'veeam-vbo', true);
      const veeamPolicyFromFunction = GET_VEEAM_POLICY(testBuckets, true);
      
      expect(veeamPolicy).toBe(veeamPolicyFromFunction);
      expect(veeamVboPolicy).toBe(veeamPolicyFromFunction);
    });
    
    it('should return Commvault policy for commvault application', () => {
      const commvaultPolicy = GET_ISV_POLICY(testBuckets, 'commvault', true);
      const parsedPolicy = JSON.parse(commvaultPolicy);
      
      expect(parsedPolicy.Version).toBe('2012-10-17');
      expect(parsedPolicy.Statement).toHaveLength(2);
      
      // Commvault policy doesn't have Sid values
      expect(parsedPolicy.Statement[0].Sid).toBeUndefined();
      expect(parsedPolicy.Statement[1].Sid).toBeUndefined();
      
      // Check resources
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[0]}`);
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[0]}/*`);
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[1]}`);
      expect(parsedPolicy.Statement[0].Resource).toContain(`arn:aws:s3:::${testBuckets[1]}/*`);
      
      // Check immutable-specific actions
      expect(parsedPolicy.Statement[0].Action).toContain('s3:PutObjectRetention');
      expect(parsedPolicy.Statement[0].Action).toContain('s3:PutObjectLegalHold');
    });
    
    it('should return default policy for unknown application', () => {
      const defaultPolicy = GET_ISV_POLICY(testBuckets, 'unknown', true);
      expect(defaultPolicy).toBe('Default Policy');
    });
  });
  
  describe('getAllowedActions', () => {
    it('should include immutable-specific actions when isImmutable is true', () => {
      const immutablePolicy = GET_VEEAM_POLICY(testBuckets, true);
      const parsedPolicy = JSON.parse(immutablePolicy);
      
      const immutableActions = [
        's3:GetObjectRetention',
        's3:GetObjectLegalHold',
        's3:PutObjectRetention',
        's3:PutObjectLegalHold',
        's3:DeleteObjectVersion',
      ];
      
      immutableActions.forEach(action => {
        expect(parsedPolicy.Statement[0].Action).toContain(action);
      });
    });
    
    it('should not include immutable-specific actions when isImmutable is false', () => {
      const nonImmutablePolicy = GET_VEEAM_POLICY(testBuckets, false);
      const parsedPolicy = JSON.parse(nonImmutablePolicy);
      
      const immutableActions = [
        's3:GetObjectRetention',
        's3:GetObjectLegalHold',
        's3:PutObjectRetention',
        's3:PutObjectLegalHold',
        's3:DeleteObjectVersion',
      ];
      
      immutableActions.forEach(action => {
        expect(parsedPolicy.Statement[0].Action).not.toContain(action);
      });
    });
    
    it('should include common actions regardless of immutability', () => {
      const immutablePolicy = JSON.parse(GET_VEEAM_POLICY(testBuckets, true));
      const nonImmutablePolicy = JSON.parse(GET_VEEAM_POLICY(testBuckets, false));
      
      const commonActions = [
        's3:GetObject',
        's3:PutObject',
        's3:GetBucketLocation',
      ];
      
      commonActions.forEach(action => {
        expect(immutablePolicy.Statement[0].Action).toContain(action);
        expect(nonImmutablePolicy.Statement[0].Action).toContain(action);
      });
    });
  });
}); 