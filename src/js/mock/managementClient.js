// @flow

import type {
    ApiAccountResponse,
    ManagementClient as ManagementClientInterface,
} from '../../types/managementClient';

import { ApiErrorObject } from './error';

export const accountObj = {
    arn: 'arn:aws:iam::538641674554:/bart/',
    canonicalId: '41901f00de359c995578b3f7af6a9ab57ccca15f1a03ed97e29ba7fdf9a09c33',
    createDate: '2020-07-09T00:21:22.000Z',
    email: 'my@email.com',
    id: '538641674554',
    quotaMax: 12,
    userName: 'bart',
};

export class MockManagementClient implements ManagementClientInterface {
    createConfigurationOverlayUser(): Promise<ApiAccountResponse> {
        return Promise.resolve({
            body: accountObj,
        });
    }
}

export class ErrorMockManagementClient implements ManagementClientInterface {
    _error: ApiErrorObject;

    constructor(error: ApiErrorObject) {
        this._error = error;
    }

    createConfigurationOverlayUser() {
        return Promise.reject(this._error);
    }
}
