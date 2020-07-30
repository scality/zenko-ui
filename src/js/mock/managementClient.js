// @flow

import type {
    ApiAccountResponse,
    ApiConfigurationResponse,
    ManagementClient as ManagementClientInterface,
} from '../../types/managementClient';
import type { Account } from '../../types/account';
import { ApiErrorObject } from './error';
import type { ConfigurationOverlay } from '../../types/config';

export const account: Account = {
    arn: 'arn:aws:iam::538641674554:/bart/',
    canonicalId: '41901f00de359c995578b3f7af6a9ab57ccca15f1a03ed97e29ba7fdf9a09c33',
    createDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
    email: 'my@email.com',
    id: '538641674554',
    quotaMax: 12,
    userName: 'bart',
};

export const latestOverlay: ConfigurationOverlay = {
    users: [
        account,
    ],
};

export class MockManagementClient implements ManagementClientInterface {
    createConfigurationOverlayUser(): Promise<ApiAccountResponse> {
        return Promise.resolve({
            body: account,
        });
    }

    deleteConfigurationOverlayUser(): Promise<void> {
        return Promise.resolve();
    }

    getConfigurationOverlayView(): Promise<ApiConfigurationResponse> {
        return Promise.resolve({
            body: latestOverlay,
        });
    }
}

export class ErrorMockManagementClient implements ManagementClientInterface {
    _error: ApiErrorObject;

    constructor(error: ApiErrorObject) {
        this._error = error;
    }

    createConfigurationOverlayUser(): Promise<ApiAccountResponse> {
        return Promise.reject(this._error);
    }

    deleteConfigurationOverlayUser(): Promise<void> {
        return Promise.reject(this._error);
    }

    getConfigurationOverlayView(): Promise<ApiConfigurationResponse> {
        return Promise.reject(this._error);
    }
}
