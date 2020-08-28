// @flow

import type {
    S3Client as S3ClientInterface,
} from '../../types/s3';

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
}
