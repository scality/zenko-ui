// @flow

import type {
    CreateBucketResponse, GetSignedUrlResponse, ListObjectsResponse,
    S3Client as S3ClientInterface,
} from '../../types/s3';
import { ApiErrorObject } from './error';
import { addTrailingSlash } from '../../react/utils';

export const ownerName = 'bart';
export const bucketName = 'bucket';
export const fileName = 'file';
export const folderName = 'folder';
export const prefix = 'toto/';
export const commonPrefix = {
    Prefix: prefix,
};
export const s3Object = {
    Key: addTrailingSlash(folderName),
    LastModified: 'Wed Oct 07 2020 16:35:57',
    Size: 0,
    SignedUrl: '',
};

export const firstFormattedObject = {
    key: 'toto/object1',
    isFolder: false,
    name: 'object1',
    lastModified: 'Wed Oct 17 2020 10:35:57',
    size: 213,
    signedUrl: '',
    toggled: false,
};

export const secondFormattedObject = {
    key: 'toto/object2',
    isFolder: false,
    name: 'object2',
    lastModified: 'Wed Oct 17 2020 16:35:57',
    size: 123213,
    signedUrl: '',
    toggled: true,
};

export const objectMetadata = {
    bucketName: bucketName,
    contentLength: 4529171,
    contentType: 'image/jpeg',
    eTag: 'af4a08eac69ced858c99caee22978773',
    lastModified: 'Fri Oct 16 2020 10:06:54',
    metadata: [],
    objectKey: 'bg.jpg',
    objectName: 'bg.jpg',
    prefixWithSlash: '',
    versionId: '',
    tags: [],
};

export const createBucketResponse: CreateBucketResponse = {
    Location: '',
};
export const file = {
    path: '',
    size: 0,
};

export const getSignedUrlResponse: GetSignedUrlResponse = '';

export const listBucketsResponse = (prefixWithSlash: string): ListObjectsResponse => ({
    CommonPrefixes: [commonPrefix],
    Contents: [s3Object],
    ContinuationToken: '',
    Delimiter: '',
    EncodingType: '',
    IsTruncated: false,
    KeyCount: 0,
    MaxKeys: 0,
    Name: '',
    NextContinuationToken: '',
    Prefix: prefixWithSlash,
    StartAfter: '',
});

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

    createFolder(): Promise<void> {
        return Promise.resolve();
    }

    listObjects(bucketName: string, prefixWithSlash: string): Promise<ListObjectsResponse> {
        return Promise.resolve(listBucketsResponse(prefixWithSlash));
    }

    getObjectSignedUrl(): Promise<GetSignedUrlResponse> {
        return Promise.resolve(getSignedUrlResponse);
    }

    uploadObject(): Promise<void> {
        return Promise.resolve();
    }

    deleteObjects(): Promise<void> {
        return Promise.resolve();
    }

    headObject(): Promise<void> {
        return Promise.resolve();
    }

    getObjectTagging(): Promise<void> {
        return Promise.resolve();
    }
}

export class ErrorMockS3Client implements S3ClientInterface {
    _error: ApiErrorObject;

    constructor(error: ApiErrorObject) {
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

    createFolder(): Promise<void> {
        return Promise.reject(this._error);
    }

    listObjects(): Promise<void> {
        return Promise.reject(this._error);
    }

    getObjectSignedUrl(): Promise<void> {
        return Promise.reject(this._error);
    }

    uploadObject(): Promise<void> {
        return Promise.reject(this._error);
    }

    deleteObjects(): Promise<void> {
        return Promise.reject(this._error);
    }

    headObject(): Promise<void> {
        return Promise.reject(this._error);
    }

    getObjectTagging(): Promise<void> {
        return Promise.reject(this._error);
    }
}
