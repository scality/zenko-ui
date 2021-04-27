// @noflow
import type { IAMClient as IAMClientInterface, IAMResp } from '../../types/iam';
import type { AccessKey } from '../../types/user';
import type { ApiAccountResponse } from '../../types/managementClient';
import { ApiErrorObject } from './error';

export const accessKeys: Array<AccessKey> = [
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

export class MockIAMClient implements IAMClientInterface {
    logout(): void {}
    login(): void {}
    createAccessKey(): Promise<IAMResp> { return Promise.resolve(); }
    createUser(): Promise<IAMResp> { return Promise.resolve(); }
    deleteAccessKey(): Promise<IAMResp> { return Promise.resolve(); }
    deleteAccessKeys(): Promise<IAMResp> { return Promise.resolve(); }
    deleteUser(): Promise<IAMResp> { return Promise.resolve(); }
    getUser(): Promise<IAMResp> { return Promise.resolve(); }
    listAccessKeys(): Promise<Array<AccessKey>> { return Promise.resolve(accessKeys); }
    listOwnAccessKeys(): Promise<IAMResp> { return Promise.resolve(accessKeys); }
    listAttachedUserPolicies(): Promise<IAMResp> { return Promise.resolve(); }
    listGroupsForUser(): Promise<IAMResp> { return Promise.resolve(); }
    listUsers(): Promise<IAMResp> { return Promise.resolve(); }
}

export class ErrorMockIAMClient implements IAMClientInterface {
    _error: ApiErrorObject;

    constructor(error: ApiErrorObject) {
        this._error = error;
    }

    logout(): void {}
    login(): void {}
    createAccessKey(): Promise<ApiAccountResponse> { return Promise.reject(this._error); }
    createUser(): Promise<ApiAccountResponse> { return Promise.reject(this._error); }
    deleteAccessKey(): Promise<ApiAccountResponse> { return Promise.reject(this._error); }
    deleteAccessKeys(): Promise<IAMResp> { return Promise.reject(this._error); }
    deleteUser(): Promise<ApiAccountResponse> { return Promise.reject(this._error); }
    getUser(): Promise<ApiAccountResponse> { return Promise.reject(this._error); }
    listAccessKeys(): Promise<ApiAccountResponse> { return Promise.reject(this._error); }
    listOwnAccessKeys(): Promise<IAMResp> { return Promise.reject(this._error); }
    listAttachedUserPolicies(): Promise<ApiAccountResponse> { return Promise.reject(this._error); }
    listGroupsForUser(): Promise<ApiAccountResponse> { return Promise.reject(this._error); }
    listUsers(): Promise<ApiAccountResponse> { return Promise.reject(this._error); }
}
