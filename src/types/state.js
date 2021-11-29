// @flow
import type { Account, AccountKey } from './account';
import type { AppConfig, InstanceId, Theme } from './entities';
import type { AuthUser, OidcLogoutFunction } from './auth';
import type {
  BucketInfo,
  ListObjectsType,
  ObjectEntity,
  ObjectMetadata,
  S3BucketList,
} from './s3';
import type { BucketList, InstanceStatus, StatsSeries } from './stats';
import type {
  ConfigurationOverlay,
  Hostname,
  LocationName,
  ReplicationStreams,
} from './config';
import type { Marker, ZenkoClient as ZenkoClientInterface } from './zenko';
import type { ErrorViewType } from './ui';
import type { IamAccessKey } from './user';
import { List } from 'immutable';
import type { ManagementClient as ManagementClientInterface } from './managementClient';
import type { RouterState } from 'connected-react-router';
import type { STSClient } from './sts';
import type { Workflows } from './workflow';

export type AuthState = {|
  +isConfigLoaded: string,
  +isClientsLoaded: boolean,
  +configFailure: boolean,
  +managementClient: ManagementClientInterface,
  +stsClient: STSClient,
  +config: AppConfig,
  +selectedAccount: Account | null,
  +oidcLogout: OidcLogoutFunction | null,
|};

export type OIDCState = {|
  +user: AuthUser,
|};

export type AssumeRoleParams = {|
  +idToken: string,
  +roleArn: string,
  +RoleSessionName: string,
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
  +accessKeyList: Array<IamAccessKey>,
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
  +messages: List<string>,
|};

export type AccountsUIState = {|
  +showDelete: boolean,
  +showKeyCreate: boolean,
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

export type ConfigUIState = {|
  +theme: Theme,
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

export type SecretsState = {|
  accountKey: AccountKey | null,
|};

export type WorkflowState = {|
  list: Workflows,
  replications: ReplicationStreams,
|};

export type WorkflowsUIState = {|
  showEditWorkflowNotification: boolean,
  showWorkflowDeleteModal: boolean,
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

export type EndpointsUIState = {|
  showDelete: Hostname,
|};

export type AppState = {
  +account: AccountState,
  +auth: AuthState,
  +configuration: ConfigurationState,
  +instances: InstancesState,
  +instanceStatus: InstanceStatusState,
  +networkActivity: NetworkActivityState,
  +oidc: OIDCState,
  +router: RouterState,
  +secrets: SecretsState,
  +uiErrors: ErrorsUIState,
  +uiLocations: LocationsUIState,
  +uiEndpoints: EndpointsUIState,
  +uiAccounts: AccountsUIState,
  +uiBuckets: BucketsUIState,
  +uiConfig: ConfigUIState,
  +uiObjects: ObjectsUIState,
  +stats: StatsState,
  +s3: S3State,
  +uiWorkflows: WorkflowsUIState,
  +workflow: WorkflowState,
  +zenko: ZenkoState,
};
