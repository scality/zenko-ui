// @flow

import type {
    ApiAccountResponse,
    ApiConfigurationResponse,
    ManagementClient as ManagementClientInterface,
} from '../../types/managementClient';
import type { ConfigurationOverlay, Location, Replication } from '../../types/config';
import type { APIWorkflows } from '../../types/workflow';
import type { Account } from '../../types/account';
import { ApiErrorObject } from './error';
import { toLocationType } from '../../types/config';

export const location: Location = {
    name: 'location1',
    locationType: toLocationType('location-file-v1'),
    details: {},
    objectId: 'object-id',
    isBuiltin: false,
    isTransient: false,
    sizeLimitGB: 10,
};

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
    users: [ account ],
    locations: { 'location1': location },
    endpoints: [],
};

export const replicationWorkflow: Replication = {
    streamId: '123e4567-e89b-12d3-a456-426614174001',
    name: 'replication',
    version: 1,
    enabled: true,
    source: {
        prefix: 'myprefix',
        bucketName: 'mybucket',
    },
    destination: {
        locations: [{ name: 'location-name' }],
        preferredReadLocation: 'location-name',
    },
};

export const workflows: APIWorkflows = [
    {
        'replication': replicationWorkflow,
    },
];

export class MockManagementClient implements ManagementClientInterface {
    createConfigurationOverlayUser(): Promise<ApiAccountResponse> {
        return Promise.resolve({
            body: account,
        });
    }

    deleteConfigurationOverlayUser(): Promise<void> {
        return Promise.resolve();
    }

    createConfigurationOverlayLocation(): Promise<Location> {
        return Promise.resolve(location);
    }

    updateConfigurationOverlayLocation(): Promise<Location> {
        return Promise.resolve(location);
    }

    deleteConfigurationOverlayLocation(): Promise<void> {
        return Promise.resolve();
    }

    getConfigurationOverlayView(): Promise<ApiConfigurationResponse> {
        return Promise.resolve({
            body: latestOverlay,
        });
    }

    searchWorkflows(): Promise<{ body: APIWorkflows }> {
        return Promise.resolve({
            body: workflows,
        });
    }

    deleteBucketWorkflowReplication(): Promise<void> {
        return Promise.resolve();
    }

    updateBucketWorkflowReplication(): Promise<{ body: Replication }> {
        return Promise.resolve({
            body: replicationWorkflow,
        });
    }

    saveBucketWorkflowReplication(): Promise<{ body: Replication }> {
        return Promise.resolve({
            body: replicationWorkflow,
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

    createConfigurationOverlayLocation(): Promise<Location> {
        return Promise.reject(this._error);
    }

    updateConfigurationOverlayLocation(): Promise<Location> {
        return Promise.reject(this._error);
    }

    deleteConfigurationOverlayLocation(): Promise<void> {
        return Promise.reject(this._error);
    }

    getConfigurationOverlayView(): Promise<ApiConfigurationResponse> {
        return Promise.reject(this._error);
    }

    searchWorkflows(): Promise<void> {
        return Promise.reject(this._error);
    }

    deleteBucketWorkflowReplication(): Promise<void> {
        return Promise.reject(this._error);
    }

    updateBucketWorkflowReplication(): Promise<void> {
        return Promise.reject(this._error);
    }

    saveBucketWorkflowReplication(): Promise<void> {
        return Promise.reject(this._error);
    }
}
