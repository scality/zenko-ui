/* eslint-disable */
import { METADATA_USER_TYPE, METADATA_SYSTEM_TYPE } from '../react/utils';
import { List } from 'immutable';
export interface S3Client {}
export type CreateBucketRequest = {
  readonly name: string;
  readonly locationContraint: string;
  readonly isObjectLockEnabled: boolean;
};
export type BucketVersioning = {
  readonly isVersioning: boolean;
};
export type RetentionMode = 'COMPLIANCE' | 'GOVERNANCE';
export type ObjectLockRetentionSettings = {
  readonly isDefaultRetentionEnabled: boolean;
  readonly retentionMode?: RetentionMode;
  readonly retentionPeriod?: {
    days?: number;
    years?: number;
  };
};
export type HeadObjectResponse = {
  readonly LastModified: string;
  readonly ContentLength: number;
  readonly ContentType: string;
  readonly ETag: string;
  readonly VersionId: string;
  readonly Metadata: Record<string, string>;
  readonly Expiration?: string;
};
export type S3BucketList = List<S3Bucket>;
export type S3Bucket = {
  readonly CreationDate: string;
  readonly Name: string;
  readonly LocationConstraint: string;
  readonly VersionStatus: Versioning;
};
export type S3Object = {
  readonly Key: string;
  readonly LastModified: string;
  readonly Size: number;
  readonly SignedUrl?: string;
  readonly ObjectRetention?: {
    readonly Mode: RetentionMode;
    readonly RetainUntilDate: string;
  };
  readonly IsLegalHoldEnabled?: boolean;
};
export type S3DeleteObject = {
  readonly Key: string;
  readonly VersionId?: string;
};
export type DeleteFolder = {
  readonly Key: string;
};
type Owner = {
  readonly DisplayName: string;
  readonly ID: string;
};
export type S3Version = {
  readonly ETag: string;
  readonly Size: number;
  readonly StorageClass: string;
  readonly Key: string;
  readonly VersionId: string;
  readonly IsLatest: boolean;
  readonly LastModified: string;
  readonly Owner: Owner;
  readonly SignedUrl: string;
  readonly ObjectRetention?: {
    readonly Mode: RetentionMode;
    readonly RetainUntilDate: string;
  };
  readonly IsLegalHoldEnabled?: boolean;
};
export type S3DeleteMarker = {
  readonly Owner: Owner;
  readonly Key: string;
  readonly VersionId: string;
  readonly IsLatest: boolean;
  readonly LastModified: string;
};
export type CommonPrefix = {
  readonly Prefix: string;
};
export type ObjectEntity = {
  readonly name: string;
  readonly key: string;
  readonly lastModified?: string;
  readonly isFolder: boolean;
  readonly size?: number;
  readonly toggled: boolean;
  readonly signedUrl?: string;
  readonly lockStatus: 'LOCKED' | 'RELEASED' | 'NONE';
  readonly objectRetention?: {
    readonly mode: RetentionMode;
    readonly retainUntilDate: string;
  };
  readonly isLatest: boolean;
  readonly versionId?: string;
  readonly isDeleteMarker?: boolean;
  readonly isLegalHoldEnabled?: boolean;
};
export type File = {
  readonly path: string;
  readonly size: number;
};
export type CreateBucketResponse = {
  readonly Location: string;
};
export type MetadataPairs = Record<string, string>;
export type MetadataItem = {
  key: string;
  value: string;
  type: '' | METADATA_USER_TYPE | METADATA_SYSTEM_TYPE;
};
export type MetadataItems = Array<MetadataItem>;
export type ListObjectsResponse = {
  readonly CommonPrefixes: Array<CommonPrefix>;
  readonly Contents: Array<S3Object>;
  readonly ContinuationToken: string;
  readonly Delimiter: string;
  readonly EncodingType: string;
  readonly IsTruncated: boolean;
  readonly KeyCount: number;
  readonly MaxKeys: number;
  readonly Name: string;
  readonly NextContinuationToken: string;
  readonly Prefix: string;
  readonly StartAfter: string;
};
export type GetSignedUrlResponse = string | null | undefined;
export type GetObjectTaggingResponse = {
  readonly VersionId?: string;
  readonly TagSet: TagSet;
};
export type PutObjectTaggingResponse = {
  readonly VersionId?: string;
};
export type Tag = {
  key: string;
  value: string;
};
export type Tags = Array<Tag>;
export type TagSetItem = {
  Key: string;
  Value: string;
};
export type TagSet = Array<TagSetItem>;
export type ObjectMetadata = {
  readonly bucketName: string;
  readonly objectKey: string;
  readonly lastModified: string;
  readonly contentLength: number;
  readonly contentType: string;
  readonly eTag: string;
  readonly versionId: string;
  readonly isLegalHoldEnabled?: boolean;
  readonly objectRetention?: {
    mode: RetentionMode;
    retainUntilDate: string;
  };
  readonly metadata: MetadataItems;
  readonly tags: Tags;
  readonly expiration?: Date;
};
export type ExpirationWFTagsFilter = {
  readonly tags: Tags;
};
export type EnabledOrDisabled = 'Disabled' | 'Enabled';
export type Versioning = EnabledOrDisabled | 'Suspended';
export type BucketInfo = {
  readonly name: string;
  readonly policy: boolean;
  readonly owner: string;
  readonly aclGrantees: number;
  readonly cors: boolean;
  readonly isVersioning: boolean;
  readonly versioning: Versioning;
  readonly public: boolean;
  readonly locationConstraint: string;
  readonly objectLockConfiguration: {
    readonly ObjectLockEnabled: EnabledOrDisabled;
    readonly Rule?: {
      readonly DefaultRetention?: {
        readonly Days?: number;
        readonly Years?: number;
        readonly Mode: RetentionMode;
      };
    };
  };
};
export type ListObjectsType = 's3' | 'md' | 'ver';
