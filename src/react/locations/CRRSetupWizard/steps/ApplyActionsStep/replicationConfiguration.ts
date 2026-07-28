import type { PutBucketReplicationCommandInput, StorageClass } from '@aws-sdk/client-s3';
import { buildCRRReplicationRuleId } from './crrLocation';

/**
 * Source-side placeholder replication role. Per the ARTESCA CRR procedure the
 * top-level `Role` is a comma-separated pair: this source role followed by the
 * destination `crr-role` ARN returned by the configurator (`SetupResult.roleArn`).
 */
export const SOURCE_REPLICATION_ROLE_ARN = 'arn:aws:iam::root:role/s3-replication-role';

type BuildReplicationConfigurationInput = {
  sourceBucketName: string;
  targetBucketName: string;
  locationName: string;
  destinationAccountName: string;
  destinationRoleArn: string;
};

/**
 * Builds the S3 PutBucketReplication input for a CRR-location destination.
 * ARTESCA reads `Destination.StorageClass` as the CRR location name (a locator,
 * not a quality-of-service class) and resolves the destination cluster from it.
 */
export const buildCRRReplicationConfiguration = ({
  sourceBucketName,
  targetBucketName,
  locationName,
  destinationAccountName,
  destinationRoleArn,
}: BuildReplicationConfigurationInput): PutBucketReplicationCommandInput => ({
  Bucket: sourceBucketName,
  ReplicationConfiguration: {
    Role: `${SOURCE_REPLICATION_ROLE_ARN},${destinationRoleArn}`,
    Rules: [
      {
        ID: buildCRRReplicationRuleId(destinationAccountName),
        Status: 'Enabled',
        Prefix: '',
        Destination: {
          Bucket: `arn:aws:s3:::${targetBucketName}`,
          // ARTESCA overloads StorageClass as the CRR location name — an arbitrary
          // string, not one of the SDK's storage-class literals.
          StorageClass: locationName as StorageClass,
        },
      },
    ],
  },
});
