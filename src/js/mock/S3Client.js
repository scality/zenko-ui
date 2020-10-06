// @flow

import type {
    CreateBucketRequest,
    S3Client as S3ClientInterface,
} from '../../types/s3';
import { ApiErrorObject } from "./error";
import type {ThunkStatePromisedAction} from "../../types/actions";

export const ownerName = 'bart';

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

    createBucket(_bucket: CreateBucketRequest): ThunkStatePromisedAction {
        return Promise.resolve({
            Location: ""
        })
    }
}

export class ErrorMockS3Client implements S3ClientInterface {
    _error: ApiErrorObject;

    constructor(error: ApiErrorObject) {
        this._error = error;
    }

    createBucket(_bucket: CreateBucketRequest): ThunkStatePromisedAction {
        return Promise.reject(this._error);
    }
}