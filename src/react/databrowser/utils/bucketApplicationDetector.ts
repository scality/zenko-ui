import {
  BUCKET_TAG_APPLICATION,
  BUCKET_TAG_VEEAM_APPLICATION,
  COMMVAULT_APPLICATION,
  VEEAM_BACKUP_REPLICATION,
} from '../../ISV/constants';
import { VeeamApplicationType } from '../../ISV/constants';
import { VEEAM_VBO_APPLICATION } from '../../ISV/modules/veeam-vbo';

/**
 * Bucket application detection result
 */
export type BucketApplicationInfo = {
  /** Display name for the application (e.g., "Veeam", "Commvault", "S3 Generic") */
  displayName: string;
  /** Whether to show Veeam capacity metrics */
  shouldShowVeeamCapacity: boolean;
};

/**
 * Detects which ISV application (if any) is associated with a bucket
 * based on its tags.
 *
 * Supports:
 * - Legacy Veeam tags (veeam:application)
 * - Modern ISV tags (application)
 * - Commvault
 * - Generic S3
 *
 * @param tags - Bucket tags as key-value pairs
 * @returns Application information including display name and feature flags
 */
export function detectBucketApplication(
  tags: Record<string, string>,
): BucketApplicationInfo {
  const modernTag = tags[BUCKET_TAG_APPLICATION];
  const legacyVeeamTag = tags[BUCKET_TAG_VEEAM_APPLICATION];

  // Priority 1: Commvault
  if (modernTag === COMMVAULT_APPLICATION) {
    return {
      displayName: COMMVAULT_APPLICATION,
      shouldShowVeeamCapacity: false,
    };
  }

  // Priority 2: Veeam (check both modern and legacy tags)
  if (isVeeamApplication(modernTag) || isVeeamApplication(legacyVeeamTag)) {
    return {
      displayName: modernTag || legacyVeeamTag,
      shouldShowVeeamCapacity: modernTag === VEEAM_BACKUP_REPLICATION,
    };
  }

  // Priority 3: Generic S3 or other modern ISV applications
  return {
    displayName: modernTag || 'S3 Generic',
    shouldShowVeeamCapacity: false,
  };
}

/**
 * Type guard to check if a tag value represents a Veeam application
 */
function isVeeamApplication(tag: string | undefined): tag is string {
  if (!tag) return false;

  return (
    tag === VEEAM_BACKUP_REPLICATION ||
    tag === VEEAM_VBO_APPLICATION ||
    tag === VeeamApplicationType.VEEAM_BACKUP_REPLICATION ||
    tag === VeeamApplicationType.VEEAM_OFFICE_365 ||
    tag === VeeamApplicationType.VEEAM_OFFICE_365_V8
  );
}
