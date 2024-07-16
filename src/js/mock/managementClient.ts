import { AccessKey, Account, SecretKey } from '../../types/account';
import {
  ApiAccountKeyResponse,
  ApiAccountResponse,
  ApiConfigurationResponse,
  ManagementClient as ManagementClientInterface,
} from '../../types/managementClient';
import {
  ConfigurationOverlay,
  Endpoint,
  Location,
  Replication,
} from '../../types/config';
import { APIWorkflows } from '../../types/workflow';
import { ApiErrorObject } from './error';
import { InstanceStatus } from '../../types/stats';
export const location: Location = {
  name: 'location1',
  locationType: 'location-file-v1',
  //@ts-expect-error fix this when you are working on it
  details: {},
  objectId: 'object-id',
  isBuiltin: false,
  isTransient: false,
  sizeLimitGB: 10,
};
export const account: Account = {
  //@ts-expect-error fix this when you are working on it
  arn: 'arn:aws:iam::538641674554:/bart/',
  canonicalId:
    '41901f00de359c995578b3f7af6a9ab57ccca15f1a03ed97e29ba7fdf9a09c33',
  createDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
  email: 'my@email.com',
  id: '538641674554',
  quotaMax: 12,
  userName: 'bart',
  Name: 'bart',
};
export const latestOverlay: ConfigurationOverlay = {
  version: 2,
  users: [account],
  locations: {
    location1: location,
  },
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
    locations: [
      {
        name: 'location-name',
      },
    ],
    preferredReadLocation: 'location-name',
  },
};
export const workflows: APIWorkflows = [
  //@ts-expect-error fix this when you are working on it
  {
    replication: replicationWorkflow,
  },
];
export const accountAccessKey: AccessKey = 'ak1';
export const accountSecretKey: SecretKey = 'sk1';
export const userName = 'bart';
export const key = {
  accessKey: accountAccessKey,
  createDate: '2021-04-28T11:19:34.000Z',
  id: '538641674554',
  secretKey: accountSecretKey,
  userName: userName,
};
export const instanceStatus: InstanceStatus = {
  metrics: {},
  state: {
    runningConfigurationVersion: 0,
    //@ts-expect-error fix this when you are working on it
    capabilities: {
      secureChannel: true,
    },
    latestConfigurationOverlay: latestOverlay,
    lastSeen: new Date().toString(),
    serverVersion: 'version',
  },
};
export const endpoint: Endpoint = {
  hostname: 's3.example.com',
  locationName: 'us-east-1',
  isBuiltin: false,
};
export class MockManagementClient implements ManagementClientInterface {
  //@ts-expect-error fix this when you are working on it
  createConfigurationOverlayUser(): Promise<ApiAccountResponse> {
    //@ts-expect-error fix this when you are working on it
    return Promise.resolve(account);
  }

  //@ts-expect-error fix this when you are working on it
  deleteConfigurationOverlayUser(): Promise<void> {
    return Promise.resolve();
  }

  //@ts-expect-error fix this when you are working on it
  createConfigurationOverlayLocation(): Promise<Location> {
    return Promise.resolve(location);
  }

  //@ts-expect-error fix this when you are working on it
  updateConfigurationOverlayLocation(): Promise<Location> {
    return Promise.resolve(location);
  }

  //@ts-expect-error fix this when you are working on it
  deleteConfigurationOverlayLocation(): Promise<void> {
    return Promise.resolve();
  }

  //@ts-expect-error fix this when you are working on it
  getConfigurationOverlayView(): Promise<ApiConfigurationResponse> {
    return Promise.resolve({
      ...latestOverlay,
    });
  }

  searchWorkflows(): Promise<APIWorkflows> {
    return Promise.resolve({
      ...workflows,
    });
  }

  //@ts-expect-error fix this when you are working on it
  deleteBucketWorkflowReplication(): Promise<void> {
    return Promise.resolve();
  }

  updateBucketWorkflowReplication(): Promise<Replication> {
    return Promise.resolve(replicationWorkflow);
  }

  saveBucketWorkflowReplication(): Promise<{
    body: Replication;
  }> {
    return Promise.resolve({
      body: replicationWorkflow,
    });
  }

  //@ts-expect-error fix this when you are working on it
  generateKeyConfigurationOverlayUser(): Promise<ApiAccountKeyResponse> {
    return Promise.resolve({
      ...key,
    });
  }

  //@ts-expect-error fix this when you are working on it
  getLatestInstanceStatus(): Promise<InstanceStatus> {
    return Promise.resolve(instanceStatus);
  }

  createConfigurationOverlayEndpoint(): Promise<Endpoint> {
    return Promise.resolve(endpoint);
  }

  //@ts-expect-error fix this when you are working on it
  deleteConfigurationOverlayEndpoint(): Promise<void> {
    return Promise.resolve();
  }
}
export class ErrorMockManagementClient implements ManagementClientInterface {
  _error: ApiErrorObject;

  constructor(error: ApiErrorObject) {
    this._error = error;
  }

  //@ts-expect-error fix this when you are working on it
  createConfigurationOverlayUser(): Promise<ApiAccountResponse> {
    return Promise.reject(this._error);
  }

  //@ts-expect-error fix this when you are working on it
  deleteConfigurationOverlayUser(): Promise<void> {
    return Promise.reject(this._error);
  }

  //@ts-expect-error fix this when you are working on it
  createConfigurationOverlayLocation(): Promise<Location> {
    return Promise.reject(this._error);
  }

  //@ts-expect-error fix this when you are working on it
  updateConfigurationOverlayLocation(): Promise<Location> {
    return Promise.reject(this._error);
  }

  //@ts-expect-error fix this when you are working on it
  deleteConfigurationOverlayLocation(): Promise<void> {
    return Promise.reject(this._error);
  }

  //@ts-expect-error fix this when you are working on it
  getConfigurationOverlayView(): Promise<ApiConfigurationResponse> {
    return Promise.reject(this._error);
  }

  //@ts-expect-error fix this when you are working on it
  searchWorkflows(): Promise<void> {
    return Promise.reject(this._error);
  }

  //@ts-expect-error fix this when you are working on it
  deleteBucketWorkflowReplication(): Promise<void> {
    return Promise.reject(this._error);
  }

  //@ts-expect-error fix this when you are working on it
  updateBucketWorkflowReplication(): Promise<void> {
    return Promise.reject(this._error);
  }

  saveBucketWorkflowReplication(): Promise<void> {
    return Promise.reject(this._error);
  }

  //@ts-expect-error fix this when you are working on it
  generateKeyConfigurationOverlayUser(): Promise<void> {
    return Promise.reject(this._error);
  }

  //@ts-expect-error fix this when you are working on it
  createConfigurationOverlayEndpoint(): Promise<void> {
    return Promise.reject(this._error);
  }

  //@ts-expect-error fix this when you are working on it
  deleteConfigurationOverlayEndpoint(): Promise<void> {
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
    return super.getLatestInstanceStatus().then((body) => ({
      ...body,
      state: {
        ...body.state,
        runningConfigurationVersion:
          this.runningVersions[this.getStatusCallCounter++],
      },
    }));
  }

  getConfigurationOverlayView(): Promise<ApiConfigurationResponse> {
    return super.getConfigurationOverlayView().then((body) => ({
      ...body,
      version: this.overlayVersions[this.getOverlayCounter++],
    }));
  }
}
