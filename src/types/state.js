// @flow
import type { AppConfig, InstanceId } from './entities';
import type { BucketInfo, ListObjectsType, ObjectEntity, ObjectMetadata, S3BucketList } from './s3';
import type { BucketList, InstanceStatus, StatsSeries } from './stats';
import type { ConfigurationOverlay, LocationName, ReplicationStreams } from './config';
import type { ErrorViewType, FailureType } from './ui';
import type { Marker, ZenkoClient as ZenkoClientInterface } from './zenko';
import type { Account } from './account';
import type { AuthUser } from './auth';
import { List } from 'immutable';
import type { ManagementClient as ManagementClientInterface } from './managementClient';
import type { RouterState } from 'connected-react-router';
import type { STSClient } from './sts';
import type { User } from './user';
import type { Workflows } from './workflow';

export type IAMResp = {};

export interface IAMClientType {
    createUser(userName: string): Promise<IAMResp>;
}

export type IAMClientState = null | {|
    +client: IAMClientType,
|};

export type UserState = {
    list: Array<User>,
};

export type AuthState = {|
    +isConfigLoaded: string,
    +isClientsLoaded: boolean,
    +configFailure: boolean,
    +managementClient: ManagementClientInterface,
    +stsClient: STSClient,
    +config: AppConfig,
    +selectedAccount: Account | null,
|};

export type OIDCState = {|
    +user: AuthUser,
|};

export type ErrorsUIState = {|
    +errorMsg: string | null,
    +errorType: ErrorViewType | null,
|};

export type ConfigurationState = {|
    +latest: ConfigurationOverlay,
|};

export type AccountState = {|
    +display: Account,
|};

export type InstancesState = {|
    +selectedId: InstanceId | null,
|};

export type InstanceStatusState = {|
    +latest: InstanceStatus,
|};

export type NetworkActivityState = {|
    +counter: number,
    +authFailure: boolean,
    +failureType?: FailureType,
    +messages: List<string>,
|};

export type AccountsUIState = {|
    +showDelete: boolean,
|};

export type BucketsUIState = {|
    +showDelete: string,
|};

export type ObjectsUIState = {|
    +showFolderCreate: boolean,
    +showObjectUpload: boolean,
    +showObjectDelete: boolean,
|};

export type LocationsUIState = {|
    +showDeleteLocation: LocationName,
|};

export type StatsState = {|
    +bucketList: BucketList,
    +allStats: StatsSeries,
|};

export type S3State = {|
    +listBucketsResults: {|
        +list: S3BucketList,
        +ownerName: string,
    |},
    +bucketInfo: BucketInfo | null,
    +listObjectsResults: {|
        +list: List<ObjectEntity>,
        +nextMarker: Marker,
        +nextVersionIdMarker: Marker,
    |},
    +listObjectsType: ListObjectsType,
    +objectMetadata: ?ObjectMetadata,
|};

export type WorkflowState = {|
    list: Workflows,
    replications: ReplicationStreams,
|};

export type WorkflowsUIState ={|
    showEditWorkflowNotification: boolean,
|};

export type ZenkoState = {|
    +zenkoClient: ZenkoClientInterface,
    +error: {|
        +message: null | string,
        +code: null | string | number,
        +target: null | string,
        +type: string | null,
    |},
|};

export type AppState = {
    +account: AccountState,
    +auth: AuthState,
    +configuration: ConfigurationState,
    +instances: InstancesState,
    +instanceStatus: InstanceStatusState,
    +networkActivity: NetworkActivityState,
    +oidc: OIDCState,
    +user: UserState,
    +router: RouterState,
    +uiErrors: ErrorsUIState,
    +uiLocations: LocationsUIState,
    +uiAccounts: AccountsUIState,
    +uiBuckets: BucketsUIState,
    +uiObjects: ObjectsUIState,
    +stats: StatsState,
    +s3: S3State,
    +uiWorkflows: WorkflowsUIState,
    +workflow: WorkflowState,
    +zenko: ZenkoState,
};
