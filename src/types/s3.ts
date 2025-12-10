import { List } from 'immutable';
// eslint-disable-next-line @typescript-eslint/no-empty-interface
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
export type S3BucketList = List<S3Bucket>;
export type S3Bucket = {
  readonly CreationDate: string;
  readonly Name: string;
  readonly LocationConstraint: string;
  readonly VersionStatus: Versioning;
};
export type CreateBucketResponse = {
  readonly Location: string;
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
