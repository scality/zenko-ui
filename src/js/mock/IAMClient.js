// @flow
import type { IamAccessKey, ListAccessKeysResponse } from '../../types/user';
import type { AWSError } from '../../types/aws';

export const accountAccessKeys: Array<IamAccessKey> = [
  {
    AccessKeyId: 'LEAST_RECENT_KEY_BBB',
    Status: 'Active',
    CreateDate: '2020-04-19T16:15:29+00:00',
  },
  {
    AccessKeyId: 'MOST_RECENT_KEY_AAAA',
    Status: 'Active',
    CreateDate: '2021-04-19T16:15:26+00:00',
  },
];

export class MockIAMClient {
  listOwnAccessKeys(): Promise<ListAccessKeysResponse> {
    return Promise.resolve({
      AccessKeyMetadata: accountAccessKeys,
    });
  }
  deleteAccessKey(): Promise<void> {
    return Promise.resolve();
  }
}

export class ErrorMockIAMClient {
  _error: AWSError;

  constructor(error: AWSError) {
    this._error = error;
  }

  listOwnAccessKeys(): Promise<void> {
    return Promise.reject(this._error);
  }
  deleteAccessKey(): Promise<void> {
    return Promise.reject(this._error);
  }
}
