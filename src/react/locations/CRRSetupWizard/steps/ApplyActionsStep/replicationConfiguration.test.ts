import { buildCRRReplicationConfiguration } from './replicationConfiguration';

describe('buildCRRReplicationConfiguration', () => {
  const config = buildCRRReplicationConfiguration({
    sourceBucketName: 'source-bucket',
    targetBucketName: 'target-bucket',
    locationName: 'location-paris-dest-10-0-0-42',
    destinationAccountName: 'paris-dest',
    destinationRoleArn: 'arn:aws:iam::123456789012:role/crr-role',
  });

  it('targets the source bucket', () => {
    expect(config.Bucket).toBe('source-bucket');
  });

  it('pairs the source replication role with the destination crr-role, as the CRR procedure requires', () => {
    expect(config.ReplicationConfiguration?.Role).toBe(
      'arn:aws:iam::root:role/s3-replication-role,arn:aws:iam::123456789012:role/crr-role',
    );
  });

  it('routes replication to the target bucket via the CRR location name', () => {
    const [rule] = config.ReplicationConfiguration?.Rules ?? [];
    expect(rule.ID).toBe('replication-paris-dest');
    expect(rule.Status).toBe('Enabled');
    expect(rule.Destination.Bucket).toBe('arn:aws:s3:::target-bucket');
    expect(rule.Destination.StorageClass).toBe('location-paris-dest-10-0-0-42');
  });
});
