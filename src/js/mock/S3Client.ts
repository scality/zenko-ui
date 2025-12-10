import {
  BucketInfo,
  CreateBucketResponse,
  S3Client as S3ClientInterface,
} from '../../types/s3';
import { AWSError } from '../../types/aws';
import { azureblobstorage } from './managementClientMSWHandlers';
export const ownerName = 'bart';
export const bucketName = 'bucket';
export const createBucketResponse: CreateBucketResponse = {
  Location: '',
};
export const bucketInfoResponseNoVersioning: BucketInfo = {
  name: bucketName,
  policy: false,
  owner: ownerName,
  aclGrantees: 0,
  cors: false,
  versioning: 'Suspended',
  isVersioning: false,
  public: false,
  locationConstraint: '',
  objectLockConfiguration: {
    ObjectLockEnabled: 'Disabled',
  },
};
export const bucketInfoResponseVersioning: BucketInfo = {
  name: bucketName,
  policy: false,
  owner: ownerName,
  aclGrantees: 0,
  cors: false,
  versioning: 'Enabled',
  isVersioning: true,
  public: false,
  locationConstraint: '',
  objectLockConfiguration: {
    ObjectLockEnabled: 'Disabled',
  },
};
export const bucketInfoResponseObjectLockNoDefaultRetention: BucketInfo = {
  name: bucketName,
  policy: false,
  owner: ownerName,
  aclGrantees: 0,
  cors: false,
  versioning: 'Suspended',
  isVersioning: false,
  public: false,
  locationConstraint: '',
  objectLockConfiguration: {
    ObjectLockEnabled: 'Enabled',
  },
};
export const bucketInfoResponseObjectLockDefaultRetention: BucketInfo = {
  name: bucketName,
  policy: false,
  owner: ownerName,
  aclGrantees: 0,
  cors: false,
  versioning: 'Suspended',
  isVersioning: false,
  public: false,
  locationConstraint: '',
  objectLockConfiguration: {
    ObjectLockEnabled: 'Enabled',
    Rule: {
      DefaultRetention: {
        Mode: 'GOVERNANCE',
        Days: 5,
      },
    },
  },
};

export const bucketInfoResponseVersioningDisabled: BucketInfo = {
  name: bucketName,
  policy: false,
  owner: ownerName,
  aclGrantees: 0,
  cors: false,
  versioning: 'Disabled',
  isVersioning: false,
  public: false,
  locationConstraint: azureblobstorage,
  objectLockConfiguration: {
    ObjectLockEnabled: 'Disabled',
  },
};

export class MockS3Client implements S3ClientInterface {
  listBucketsWithLocation() {
    return Promise.resolve({
      Buckets: [],
      Owner: {
        DisplayName: ownerName,
        ID: 'id1',
      },
    });
  }

  createBucket(): Promise<CreateBucketResponse> {
    return Promise.resolve(createBucketResponse);
  }

  deleteBucket(): Promise<void> {
    return Promise.resolve();
  }

  getBucketInfo(): Promise<BucketInfo> {
    return Promise.resolve(bucketInfoResponseNoVersioning);
  }

  toggleVersioning(): Promise<void> {
    return Promise.resolve();
  }

  putObjectLockConfiguration(): Promise<void> {
    return Promise.resolve();
  }

  getObjectLegalHold(): Promise<void> {
    return Promise.resolve();
  }
}
export class ErrorMockS3Client implements S3ClientInterface {
  _error: AWSError;

  constructor(error: AWSError) {
    this._error = error;
  }

  createBucket(): Promise<void> {
    return Promise.reject(this._error);
  }

  listBucketsWithLocation(): Promise<void> {
    return Promise.reject(this._error);
  }

  deleteBucket(): Promise<void> {
    return Promise.reject(this._error);
  }

  bucketInfo(): Promise<void> {
    return Promise.reject(this._error);
  }

  getBucketInfo(): Promise<void> {
    return Promise.reject(this._error);
  }

  toggleVersioning(): Promise<void> {
    return Promise.reject(this._error);
  }

  putObjectLockConfiguration(): Promise<void> {
    return Promise.reject(this._error);
  }

  getObjectLegalHold(): Promise<void> {
    return Promise.reject(this._error);
  }
}
