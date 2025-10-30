import { S3OperationConfig } from '../../next-architecture/domain/interfaces/IS3Operations';
import { ISVPlatformConfig } from '../types';
import { BUCKET_TAG_APPLICATION } from '../constants';

export function getISVOperationConfig(
  platform: ISVPlatformConfig,
  enableImmutableBackup?: boolean,
): S3OperationConfig {
  const baseConfig: S3OperationConfig = {
    bucketTags: [
      {
        Key: BUCKET_TAG_APPLICATION,
        Value: platform.bucketTag,
      },
    ],
  };

  if (platform.id === 'veeam-vbr') {
    return {
      ...baseConfig,
      objectLockEnabled: enableImmutableBackup,
      contentType: 'text/xml',
    };
  }

  if (platform.id === 'veeam-vbo') {
    return {
      ...baseConfig,
      objectLockEnabled: enableImmutableBackup,
      contentType: 'text/xml',
    };
  }

  if (platform.id === 'commvault') {
    return {
      ...baseConfig,
      objectLockEnabled: enableImmutableBackup,
    };
  }

  return baseConfig;
}
