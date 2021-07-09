// @flow

import type { APIWorkflows, Workflows } from '../../types/workflow';
import type { AccessKey, Account, SecretKey } from '../../types/account';
import type {
    ApiAccountKeyResponse,
    ApiAccountResponse,
    ApiConfigurationResponse,
    ManagementClient as ManagementClientInterface,
} from '../../types/managementClient';
import type { ConfigurationOverlay, Expiration, Location, Replication } from '../../types/config';
import { ApiErrorObject } from './error';
import type { InstanceStatus } from '../../types/stats';
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

export const location2: Location = {
    name: 'location2',
    locationType: toLocationType('location-scality-hdclient-v2'),
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
    version: 2,
    users: [account],
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

export const expirationWorkflow: Expiration = {
    workflowId: '321e4567-e89b-12d3-a456-426614174001',
    name: 'expiration',
    enabled: true,
    bucketName: 'mybucket',
    type: 'bucket-workflow-expiration-v1',
    filter: {
        objectKeyPrefix: 'myprefix',
    },
    currentVersionTriggerDelayDays: 1,
    currentVersionTriggerDelayDate: '',
    previousVersionTriggerDelayDays: 3,
};

export const apiWorkflows: APIWorkflows = [
    {
        'replication': replicationWorkflow,
        'expiration': expirationWorkflow,
    },
];

export const workflows: Workflows = [{
    id: 'replication-id',
    bucketName: 'mybucket',
    type: 'replication',
    name: 'replicationName',
    state: true,
    workflowId: 'replication-workflow-id',
}];

export const accountAccessKey: AccessKey = 'ak1';
export const accountSecretKey: SecretKey = 'sk1';
export const accountName = 'bart';
export const key = {
    accessKey: accountAccessKey,
    createDate: '2021-04-28T11:19:34.000Z',
    id: '538641674554',
    secretKey: accountSecretKey,
    userName: accountName,
};

export const instanceStatus: InstanceStatus = {
    metrics: {},
    state: {
        runningConfigurationVersion: 0,
        capabilities: {
            secureChannel: true,
        },
        latestConfigurationOverlay: latestOverlay,
        lastSeen: new Date().toString(),
        serverVersion: 'version',
    },
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
            body: apiWorkflows,
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

    createBucketWorkflowReplication(): Promise<{ body: Replication }> {
        return Promise.resolve({
            body: replicationWorkflow,
        });
    }

    deleteBucketWorkflowExpiration(): Promise<void> {
        return Promise.resolve();
    }

    updateBucketWorkflowExpiration(): Promise<{ body: Expiration }> {
        return Promise.resolve({
            body: expirationWorkflow,
        });
    }

    createBucketWorkflowExpiration(): Promise<{ body: Expiration }> {
        return Promise.resolve({
            body: expirationWorkflow,
        });
    }

    generateKeyConfigurationOverlayUser(): Promise<ApiAccountKeyResponse> {
        return Promise.resolve({
            body: key,
        });
    }

    getLatestInstanceStatus(): Promise<{ body: InstanceStatus }> {
        return Promise.resolve({
            body: instanceStatus,
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

    createBucketWorkflowReplication(): Promise<void> {
        return Promise.reject(this._error);
    }

    deleteBucketWorkflowExpiration(): Promise<void> {
        return Promise.reject(this._error);
    }

    updateBucketWorkflowExpiration(): Promise<void> {
        return Promise.reject(this._error);
    }

    createBucketWorkflowExpiration(): Promise<void> {
        return Promise.reject(this._error);
    }

    generateKeyConfigurationOverlayUser(): Promise<void> {
        return Promise.reject(this._error);
    }
}

export class MockManagementClientWithConfigurationVersions extends MockManagementClient {
    getStatusCallCounter: number;
    runningVersions: Array<number>;
    getOverlayCounter: number;
    overlayVersions: Array<number>;

    constructor(runningVersions: Array<number>, overlayVersions: Array<number>) {
        super();

        this.getStatusCallCounter = 0;
        this.runningVersions = runningVersions;

        this.getOverlayCounter = 0;
        this.overlayVersions = overlayVersions;
    }

    getLatestInstanceStatus(): Promise<any> {
        return super.getLatestInstanceStatus()
            .then(({ body }) => ({
                body: {
                    ...body,
                    state: {
                        ...body.state,
                        runningConfigurationVersion: this.runningVersions[this.getStatusCallCounter++],
                    },
                },
            }));
    }

    getConfigurationOverlayView(): Promise<ApiConfigurationResponse> {
        return super.getConfigurationOverlayView()
            .then(({ body }) => ({
                body: {
                    ...body,
                    version: this.overlayVersions[this.getOverlayCounter++],
                },
            }));
    }
}
