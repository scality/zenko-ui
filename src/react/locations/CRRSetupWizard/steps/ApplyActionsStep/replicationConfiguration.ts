import type { PutBucketReplicationCommandInput, ReplicationConfiguration, StorageClass } from '@aws-sdk/client-s3';
import { buildCRRReplicationRuleId } from './crrLocation';

/**
 * Source-side placeholder replication role. Per the ARTESCA CRR procedure the
 * top-level `Role` is a comma-separated pair: this source role followed by the
 * destination `crr-role` ARN returned by the configurator (`SetupResult.roleArn`).
 */
export const SOURCE_REPLICATION_ROLE_ARN = 'arn:aws:iam::root:role/s3-replication-role';

export type BuildReplicationConfigurationInput = {
  sourceBucketName: string;
  targetBucketName: string;
  locationName: string;
  destinationRoleArn: string;
};

const accountOf = (roleArn: string): string => roleArn.split(':')[4] ?? '';

// A single role (the rule form's default) has no destination half: replication would silently never happen.
const isSourceDestinationPair = (role?: string): role is string => (role ?? '').split(',').length === 2;

/**
 * `Account` points the rule at this destination's role, which has the same name on every site.
 * An earlier rule to the same location and target bucket is replaced: the backend rejects overlapping ones.
 */
export const buildCRRReplicationConfiguration = (
  { sourceBucketName, targetBucketName, locationName, destinationRoleArn }: BuildReplicationConfigurationInput,
  existing?: ReplicationConfiguration,
): PutBucketReplicationCommandInput => {
  const destinationBucket = `arn:aws:s3:::${targetBucketName}`;
  const otherRules = (existing?.Rules ?? []).filter(
    (rule) => !(rule.Destination?.StorageClass === locationName && rule.Destination?.Bucket === destinationBucket),
  );

  return {
    Bucket: sourceBucketName,
    ReplicationConfiguration: {
      Role: isSourceDestinationPair(existing?.Role)
        ? existing.Role
        : `${SOURCE_REPLICATION_ROLE_ARN},${destinationRoleArn}`,
      Rules: [
        ...otherRules,
        {
          ID: buildCRRReplicationRuleId(locationName, targetBucketName),
          Status: 'Enabled',
          // The backend rejects mixing V1 (`Prefix`) and V2 (`Filter`) rules with MalformedXML.
          ...(otherRules.some((rule) => rule.Filter) ? { Filter: { Prefix: '' } } : { Prefix: '' }),
          Destination: {
            Bucket: destinationBucket,
            // ARTESCA overloads StorageClass as the CRR location name — an arbitrary
            // string, not one of the SDK's storage-class literals.
            StorageClass: locationName as StorageClass,
            Account: accountOf(destinationRoleArn),
          },
        },
      ],
    },
  };
};
