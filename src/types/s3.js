// @flow
import { METADATA_USER_TYPE, METADATA_SYSTEM_TYPE } from '../react/utils';
import { List } from 'immutable';

export interface S3Client {}

export type CreateBucketRequest = {|
  +name: string,
  +locationContraint: string,
  +isObjectLockEnabled: boolean,
|};

export type BucketVersioning = {|
  +isVersioning: boolean,
|};

export type RetentionMode = 'COMPLIANCE' | 'GOVERNANCE';
export type ObjectLockRetentionSettings = {|
  +isDefaultRetentionEnabled: boolean,
  +retentionMode?: RetentionMode,
  +retentionPeriod?: { days?: number, years?: number },
|};

export type HeadObjectResponse = {|
  +LastModified: string,
  +ContentLength: number,
  +ContentType: string,
  +ETag: string,
  +VersionId: string,
  +Metadata: { [string]: string },
|};

export type S3BucketList = List<S3Bucket>;

export type S3Bucket = {|
  +CreationDate: string,
  +Name: string,
  +LocationConstraint: string,
  +VersionStatus: Versioning,
|};

export type S3Object = {|
  +Key: string,
  +LastModified: string,
  +Size: number,
  +SignedUrl?: string,
  +ObjectRetention?: {|
    +Mode: RetentionMode,
    +RetainUntilDate: string,
  |},
|};

export type S3DeleteObject = {|
  +Key: string,
  +VersionId?: string,
|};

export type DeleteFolder = {|
  +Key: string,
|};

type Owner = {|
  +DisplayName: string,
  +ID: string,
|};

export type S3Version = {|
  +ETag: string,
  +Size: number,
  +StorageClass: string,
  +Key: string,
  +VersionId: string,
  +IsLatest: boolean,
  +LastModified: string,
  +Owner: Owner,
  +SignedUrl: string,
  +ObjectRetention?: {|
    +Mode: RetentionMode,
    +RetainUntilDate: string,
  |},
|};

export type S3DeleteMarker = {|
  +Owner: Owner,
  +Key: string,
  +VersionId: string,
  +IsLatest: boolean,
  +LastModified: string,
|};

export type CommonPrefix = {|
  +Prefix: string,
|};

export type ObjectEntity = {|
  +name: string,
  +key: string,
  +lastModified?: string,
  +isFolder: boolean,
  +size?: number,
  +toggled: boolean,
  +signedUrl?: string,
  +lockStatus: 'LOCKED' | 'RELEASED' | 'NONE',
  +objectRetention?: {|
    +mode: RetentionMode,
    +retainUntilDate: string,
  |},
  +isLatest: boolean,
  +versionId?: string,
  +isDeleteMarker?: boolean,
|};

export type File = {|
  +path: string,
  +size: number,
|};

export type CreateBucketResponse = {|
  +Location: string,
|};

export type MetadataPairs = { [string]: string };

export type MetadataItem = {
  key: string,
  value: string,
  type: '' | METADATA_USER_TYPE | METADATA_SYSTEM_TYPE,
};

export type MetadataItems = Array<MetadataItem>;

export type ListObjectsResponse = {|
  +CommonPrefixes: Array<CommonPrefix>,
  +Contents: Array<S3Object>,
  +ContinuationToken: string,
  +Delimiter: string,
  +EncodingType: string,
  +IsTruncated: boolean,
  +KeyCount: number,
  +MaxKeys: number,
  +Name: string,
  +NextContinuationToken: string,
  +Prefix: string,
  +StartAfter: string,
|};

export type GetSignedUrlResponse = ?string;

export type GetObjectTaggingResponse = {|
  +VersionId?: string,
  +TagSet: TagSet,
|};

export type PutObjectTaggingResponse = {|
  +VersionId?: string,
|};

export type Tag = { key: string, value: string };
export type Tags = Array<Tag>;
export type TagSetItem = { Key: string, Value: string };
export type TagSet = Array<TagSetItem>;

export type ObjectMetadata = {|
  +bucketName: string,
  +objectKey: string,
  +lastModified: string,
  +contentLength: number,
  +contentType: string,
  +eTag: string,
  +versionId: string,
  +metadata: MetadataItems,
  +tags: Tags,
|};

export type EnabledOrDisabled = 'Disabled' | 'Enabled';
export type Versioning = EnabledOrDisabled | 'Suspended';

export type BucketInfo = {|
  +name: string,
  +policy: boolean,
  +owner: string,
  +aclGrantees: number,
  +cors: boolean,
  +isVersioning: boolean,
  +versioning: Versioning,
  +public: boolean,
  +locationConstraint: string,
  +objectLockConfiguration: {|
    +ObjectLockEnabled: EnabledOrDisabled,
    +Rule?: {|
      +DefaultRetention?: {|
        +Days?: number,
        +Years?: number,
        +Mode: RetentionMode,
      |},
    |},
  |},
|};

export type ListObjectsType = 's3' | 'md' | 'ver';
