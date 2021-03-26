// @noflow
import { ErrorMockS3Client, MockS3Client } from './S3Client';
import type {
    SearchBucketResp,
    ZenkoClient as ZenkoClientInterface,
} from '../../types/zenko';
import { ApiErrorObject } from './error';

export class MockZenkoClient extends MockS3Client implements ZenkoClientInterface {
    _init(): void {}
    logout(): void {}
    login(): void {}

    searchBucket(): Promise<SearchBucketResp> {
        return Promise.resolve({ IsTruncated: false, Contents: [] });
    }
}

export class ErrorMockZenkoClient extends ErrorMockS3Client implements ZenkoClientInterface {
    _error: ApiErrorObject;

    constructor(error: ApiErrorObject) {
        super(error);
        this._error = error;
    }

    searchBucket(): Promise<void> {
        return Promise.reject(this._error);
    }
}
