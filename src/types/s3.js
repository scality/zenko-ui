// @flow
import { METADATA_SYSTEM_TYPE, METADATA_USER_TYPE } from '../react/utils';

export interface S3Client {

}

export type CreateBucketRequest = {|
    +name: string,
    +locationContraint: string,
|};

export type HeadObjectResponse = {|
    +LastModified: string,
    +ContentLength: number,
    +ContentType: string,
    +ETag: string,
    +VersionId: string,
    +Metadata: { [string]: string },
|};

export type S3Bucket = {|
    +CreationDate: string,
    +Name: string,
|};

export type S3Object = {|
    +Key: string,
    +LastModified: string,
    +Size: number,
    +SignedUrl?: string,
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
    +VersionId?: string;
    +TagSet: TagSet;
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

export type Versioning = 'Disabled' | 'Enabled' | 'Suspended';

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
|};

export type ListObjectsType = 's3' | 'md' | 'ver';
