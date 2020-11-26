// @noflow

import type { AccountState, AccountsUIState, AuthState, BucketsUIState, ConfigurationState, InstanceStatusState, NetworkActivityState, OIDCState, ObjectsUIState, S3State, UIErrorState } from '../../types/state';
import { List, Map } from 'immutable';
import { MockManagementClient } from '../../js/mock/managementClient';
import { MockSTSClient } from '../../js/mock/STSClient';
import { MockUserManager } from '../../js/mock/userManager';
import { MockZenkoClient } from '../../js/mock/ZenkoClient';
import { LIST_OBJECTS_S3_TYPE } from '../../react/utils/s3';

export const initialAccountState: AccountState = {
    display: {},
};

export const initialAccountsUIState: AccountsUIState = { showDelete: false };

export const initialAuthState: AuthState = {
    isUserLoaded: false,
    configFailure: false,
    isSigningOut: false,
    stsClient: new MockSTSClient(),
    managementClient: new MockManagementClient(),
    userManager: new MockUserManager(),
    config: {
    },
};

export const initialS3State: S3State = {
    listBucketsResults: {
        list: List(),
        ownerName: '',
    },
    ListObjectsType: LIST_OBJECTS_S3_TYPE,
    bucketInfo: null,
    listObjectsResults: {
        list: List(),
        nextMarker: null,
    },
    objectMetadata: null,
};

export const initialBucketState = { list: [] };
export const initialBucketUIState: BucketsUIState = { showDelete: '' };

export const initialConfiguration: ConfigurationState = {
    latest: {
        version: 1,
        updatedAt: '2017-09-28T19:39:22.191Z',
        creator: 'initial',
        instanceId: 'demo-instance',
        locations: {},
        replicationStreams: [],
        users: [],
        endpoints: [],
        workflows: {
            lifecycle: {},
            transition: {},
        },
    },
};

export const initialErrorsUIState: UIErrorState = { errorMsg: null, errorType: null };
export const initialInstancesState = {};
export const initialInstanceStatus: InstanceStatusState = {
    latest: {
        state: {
            capabilities: {
                secureChannel: true,
            },
            lastSeen: '',
            latestConfigurationOverlay: initialConfiguration.latest,
            serverVersion: '',
        },
        metrics: {
            'item-counts': {
                dataManaged: {
                    total: {
                        curr: 0,
                        prev: 0,
                    },
                    byLocation: {},
                },
                bucketList: [],
                buckets: 0,
                versions: 0,
                objects: 0,
            },
            'data-disk-usage': {
                available: 0,
                total: 0,
                free: 0,
            },
            'cpu': {
                idle: 0,
                nice: 0,
                sys: 0,
                user: 0,
            },
            'memory': {
                free: 0,
                total: 0,
            },
            'crr-stats': {
                backlog: {
                    count: 0,
                    size: 0,
                },
                completions: {
                    count: 0,
                    size: 0,
                },
                throughput: {
                    count: 0,
                    size: 0,
                },
                failures: {
                    count: 0,
                    size: 0,
                },
                pending: {
                    count: 0,
                    size: 0,
                },
                stalled: { count: 0 },
                byLocation: {},
            },
            'crr-schedule': {
                states: {},
                schedules: {},
            },
            'ingest-schedule': {
                states: {},
                schedules: {},
            },
        },
    },
};
export const initialLocationsUIState = { showDeleteLocation: '' };
export const initialNetworkActivityState: NetworkActivityState = { counter: 0, messages: List() };
export const initialOidc: OIDCState = {
    user: null,
    isLoadingUser: false,
};

export const initialObjectUIState: ObjectsUIState = {
    showFolderCreate: false,
    showObjectUpload: false,
    showObjectDelete:  false,
};

export const initialSecretsState = Map();
export const initialStatsState = {
    bucketList: [],
};
export const initialUserUIState = { showDelete: false, showSecret: null, showDeleteKey: null };
export const initialUserState = {
    list: [],
    accessKeyList: [],
    attachedPoliciesList: [],
    groupList: [],
    displayedUser: {},
};

export const initialZenkoState = {
    zenkoClient: new MockZenkoClient,
    error: {
        message: null,
        code: null,
        target: null,
        type: null,
    },
};

export const initialFullState = {
    account: initialAccountState,
    auth: initialAuthState,
    configuration: initialConfiguration,
    instanceStatus: initialInstanceStatus,
    instances: initialInstancesState,
    networkActivity: initialNetworkActivityState,
    s3: initialS3State,
    secrets: initialSecretsState,
    stats: initialStatsState,
    uiAccounts: initialAccountsUIState,
    uiUser: initialUserUIState,
    uiLocations: initialLocationsUIState,
    uiObjects: initialObjectUIState,
    uiErrors: initialErrorsUIState,
    uiBuckets: initialBucketUIState,
    user: initialUserState,
    oidc: initialOidc,
    zenko: initialZenkoState,
};
