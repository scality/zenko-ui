// @flow

import type {
    CreateBucketResponse,
    S3Client as S3ClientInterface,
} from '../../types/s3';
import { ApiErrorObject } from './error';

export const ownerName = 'bart';
export const bucketName = 'test';

export const createBucketResponse: CreateBucketResponse = {
    Location: '',
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
}
