// @flow

import type {
    CreateBucketResponse,
    S3Client as S3ClientInterface,
} from '../../types/s3';
import { ApiErrorObject } from './error';

export const ownerName = 'bart';

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
}

export class ErrorMockS3Client implements S3ClientInterface {
    _error: ApiErrorObject;

    constructor(error: ApiErrorObject) {
        this._error = error;
    }

    createBucket(): Promise<void> {
        return Promise.reject(this._error);
    }
}
