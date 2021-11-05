// @flow
import type { AccessKey, Account, SecretKey } from './account';
import type { AppConfig, InstanceId, Theme } from './entities';
import type { AuthUser, OidcLogoutFunction } from './auth';
import type {
  BucketInfo,
  CommonPrefix,
  HeadObjectResponse,
  S3Bucket,
  S3DeleteMarker,
  S3Object,
  S3Version,
  TagSet,
  RetentionMode,
} from './s3';
import type { ConfigurationOverlay, Hostname, LocationName } from './config';
import type { InstanceStatus, StatsSeries } from './stats';
import type { Marker, SearchResultList, ZenkoClient } from './zenko';
import type { APIWorkflows } from './workflow';
import type { AppState } from './state';
import type { IamAccessKey } from './user';
import type { ManagementClient } from './managementClient';
import type { STSClient } from './sts';

export type DispatchFunction = Action => any;
export type GetStateFunction = () => AppState;

export interface ApiError extends Error {
  status: 200 | 401 | 403 | 422 | 500 | 503;
}

export type PromiseAction = Promise<Action>;
export type ThunkStatePromisedAction = (
  DispatchFunction,
  GetStateFunction,
) => Promise<mixed>;
export type ThunkStateAction = (DispatchFunction, GetStateFunction) => void;
export type ThunkNonStatePromisedAction = DispatchFunction => Promise<void>;
export type ThunkNonStateAction = DispatchFunction => void;

// error action
export type ClearErrorAction = {|
  +type: 'CLEAR_ERROR',
|};

export type HandleErrorAction = {|
  +type: 'HANDLE_ERROR',
  +errorMsg: string | void,
  +errorType: string | null,
|};

export type ErrorsUIAction =
  | HandleErrorAction
  | ClearErrorAction
  | NetworkActivityAuthResetAction;

// auth actions
export type SetSTSClientAction = {|
  +type: 'SET_STS_CLIENT',
  +stsClient: STSClient,
|};

export type SetManagementClientAction = {|
  +type: 'SET_MANAGEMENT_CLIENT',
  +managementClient: ManagementClient,
|};

export type SetAppConfigAction = {|
  +type: 'SET_APP_CONFIG',
  +config: AppConfig,
|};

export type ConfigAuthFailureAction = {|
  +type: 'CONFIG_AUTH_FAILURE',
|};

export type LoadConfigSuccessAction = {|
  +type: 'LOAD_CONFIG_SUCCESS',
|};

export type LoadClientsSuccessAction = {|
  +type: 'LOAD_CLIENTS_SUCCESS',
|};

export type SelectAccountAction = {|
  +type: 'SELECT_ACCOUNT',
  +account: Account,
|};

export type SetThemeAction = {|
  +type: 'SET_THEME',
  +theme: Theme,
|};

export type SetOIDCLogoutAction = {|
  +type: 'SET_OIDC_LOGOUT',
  +logout: OidcLogoutFunction | null,
|};

export type AuthAction =
  | SetSTSClientAction
  | SetManagementClientAction
  | SetAppConfigAction
  | ConfigAuthFailureAction
  | LoadConfigSuccessAction
  | LoadClientsSuccessAction
  | SelectAccountAction
  | SetOIDCLogoutAction;

// account actions

export type ListAccountAccessKeySuccessAction = {|
  +type: 'LIST_ACCOUNT_ACCESS_KEY_SUCCESS',
  +accessKeys: Array<IamAccessKey>,
|};

export type AccountAction = ListAccountAccessKeySuccessAction;

// instances actions
export type SelectInstanceAction = {|
  +type: 'SELECT_INSTANCE',
  +selectedId: InstanceId,
|};

// s3 actions
export type ListBucketsSuccessAction = {|
  +type: 'LIST_BUCKETS_SUCCESS',
  +list: Array<S3Bucket>,
  +ownerName: string,
|};

export type GetBucketInfoSuccessAction = {|
  +type: 'GET_BUCKET_INFO_SUCCESS',
  +info: BucketInfo,
|};

export type ToggleObjectAction = {|
  +type: 'TOGGLE_OBJECT',
  +objectKey: string,
  +versionId?: string,
|};

export type ToggleAllObjectsAction = {|
  +type: 'TOGGLE_ALL_OBJECTS',
  +toggled: boolean,
|};

export type ListObjectsSuccessAction = {|
  +type: 'LIST_OBJECTS_SUCCESS',
  +contents: Array<S3Object>,
  +commonPrefixes: Array<CommonPrefix>,
  +prefix: string,
  +nextMarker: Marker,
|};

export type ContinueListObjectsSuccessAction = {|
  +type: 'CONTINUE_LIST_OBJECTS_SUCCESS',
  +contents: Array<S3Object>,
  +commonPrefixes: Array<CommonPrefix>,
  +prefix: string,
  +nextMarker: Marker,
|};

export type ListObjectVersionsSuccessAction = {|
  +type: 'LIST_OBJECT_VERSIONS_SUCCESS',
  +versions: Array<S3Version>,
  +deleteMarkers: Array<S3DeleteMarker>,
  +commonPrefixes: Array<CommonPrefix>,
  +prefix: string,
  +nextMarker: Marker,
  +nextVersionIdMarker: Marker,
|};

export type ContinueListObjectVersionsSuccessAction = {|
  +type: 'CONTINUE_LIST_OBJECT_VERSIONS_SUCCESS',
  +versions: Array<S3Version>,
  +deleteMarkers: Array<S3DeleteMarker>,
  +commonPrefixes: Array<CommonPrefix>,
  +prefix: string,
  +nextMarker: Marker,
  +nextVersionIdMarker: Marker,
|};

export type GetObjectMetadataSuccessAction = {|
  +type: 'GET_OBJECT_METADATA_SUCCESS',
  +bucketName: string,
  +objectKey: string,
  +info: HeadObjectResponse,
  +tags: TagSet,
  +ObjectRetention: {|
    Mode: RetentionMode,
    RetainUntilDate: Date,
  |},
|};

export type ResetObjectMetadataAction = {|
  +type: 'RESET_OBJECT_METADATA',
|};

export type ZenkoWriteSearchListAction = {|
  +type: 'ZENKO_CLIENT_WRITE_SEARCH_LIST',
  +nextMarker: Marker,
  +list: SearchResultList,
|};

export type ZenkoAppendSearchListAction = {|
  +type: 'ZENKO_CLIENT_APPEND_SEARCH_LIST',
  +nextMarker: Marker,
  +list: SearchResultList,
|};

export type S3Action =
  | GetBucketInfoSuccessAction
  | ListBucketsSuccessAction
  | ListObjectsSuccessAction
  | ContinueListObjectsSuccessAction
  | ListObjectVersionsSuccessAction
  | ContinueListObjectVersionsSuccessAction
  | GetObjectMetadataSuccessAction
  | ResetObjectMetadataAction
  | ToggleAllObjectsAction
  | ToggleObjectAction
  | ZenkoWriteSearchListAction
  | ZenkoAppendSearchListAction;

// zenko actions
export type SetZenkoClientAction = {|
  +type: 'SET_ZENKO_CLIENT',
  +zenkoClient: ZenkoClient,
|};

export type ZenkoClearAction = {|
  +type: 'ZENKO_CLEAR_ERROR',
|};

export type ZenkoErrorAction = {|
  +type: 'ZENKO_HANDLE_ERROR',
  +errorMsg: string | null,
  +errorCode: string | number | null,
  +errorType: string | null,
  +errorTarget: string | null,
|};

export type ZenkoAction =
  | SetZenkoClientAction
  | ZenkoClearAction
  | ZenkoErrorAction
  | ZenkoWriteSearchListAction
  | ListObjectsSuccessAction;

// ui buckets actions
export type OpenBucketDeleteDialogAction = {|
  +type: 'OPEN_BUCKET_DELETE_DIALOG',
  +bucketName: string,
|};

export type CloseBucketDeleteDialogAction = {|
  +type: 'CLOSE_BUCKET_DELETE_DIALOG',
|};

export type BucketsUIAction =
  | OpenBucketDeleteDialogAction
  | CloseBucketDeleteDialogAction;

// ui objects actions
export type OpenFolderCreateModalAction = {|
  +type: 'OPEN_FOLDER_CREATE_MODAL',
|};

export type CloseFolderCreateModalAction = {|
  +type: 'CLOSE_FOLDER_CREATE_MODAL',
|};

export type OpenObjectUploadModalAction = {|
  +type: 'OPEN_OBJECT_UPLOAD_MODAL',
|};

export type CloseObjectUploadModalAction = {|
  +type: 'CLOSE_OBJECT_UPLOAD_MODAL',
|};

export type OpenObjectDeleteModalAction = {|
  +type: 'OPEN_OBJECT_DELETE_MODAL',
|};

export type CloseObjectDeleteModalAction = {|
  +type: 'CLOSE_OBJECT_DELETE_MODAL',
|};

export type ObjectsUIAction =
  | OpenFolderCreateModalAction
  | CloseFolderCreateModalAction
  | OpenObjectUploadModalAction
  | CloseObjectUploadModalAction
  | OpenObjectDeleteModalAction
  | CloseObjectDeleteModalAction;

// networkActivity actions
export type NetworkActivityAuthFailureAction = {|
  +type: 'NETWORK_AUTH_FAILURE',
|};

export type NetworkActivityStartAction = {|
  +type: 'NETWORK_START',
  +message: string,
|};

export type NetworkActivityEndAction = {|
  +type: 'NETWORK_END',
|};

export type NetworkActivityAuthResetAction = {|
  +type: 'NETWORK_AUTH_RESET',
|};

export type NetworkActivityAction =
  | NetworkActivityAuthFailureAction
  | NetworkActivityStartAction
  | NetworkActivityEndAction
  | NetworkActivityAuthResetAction;

// configuration actions
export type InstanceStatusAction = {|
  +type: 'INSTANCE_STATUS',
  +status?: InstanceStatus,
|};

export type ConfigurationVersionAction = {|
  +type: 'CONFIGURATION_VERSION',
  +configuration: ConfigurationOverlay,
|};

export type ConfigurationAction =
  | InstanceStatusAction
  | ConfigurationVersionAction;

// account UI actions
export type OpenAccountDeleteDialogAction = {|
  +type: 'OPEN_ACCOUNT_DELETE_DIALOG',
|};

export type CloseAccountDeleteDialogAction = {|
  +type: 'CLOSE_ACCOUNT_DELETE_DIALOG',
|};

export type OpenAccountKeyCreateModalAction = {|
  +type: 'OPEN_ACCOUNT_KEY_CREATE_MODAL',
|};

export type CloseAccountKeyCreateModalAction = {|
  +type: 'CLOSE_ACCOUNT_KEY_CREATE_MODAL',
|};

export type AccountUIAction =
  | OpenAccountDeleteDialogAction
  | CloseAccountDeleteDialogAction
  | OpenAccountKeyCreateModalAction
  | CloseAccountKeyCreateModalAction;

export type OpenLocationDeleteDialogAction = {|
  +type: 'OPEN_LOCATION_DELETE_DIALOG',
  +locationName: LocationName,
|};

export type CloseLocationDeleteDialogAction = {|
  +type: 'CLOSE_LOCATION_DELETE_DIALOG',
|};

export type LocationUIAction =
  | OpenLocationDeleteDialogAction
  | CloseLocationDeleteDialogAction;

export type ReceiveInstanceStatsAction = {|
  +type: 'RECEIVE_INSTANCE_STATS',
  +stats: StatsSeries,
|};

export type StatsAction = InstanceStatusAction | ReceiveInstanceStatsAction;

export type CloseWorkflowEditNotificationAction = {|
  +type: 'CLOSE_WORKFLOW_EDIT_NOTIFICATION',
|};

export type OpenWorkflowEditNotificationAction = {|
  +type: 'OPEN_WORKFLOW_EDIT_NOTIFICATION',
|};

export type OpenWorkflowDeleteModalAction = {|
  +type: 'OPEN_WORKFLOW_DELETE_MODAL',
|};

export type CloseWorkflowDeleteModalAction = {|
  +type: 'CLOSE_WORKFLOW_DELETE_MODAL',
|};

export type WorkflowUIAction =
  | CloseWorkflowEditNotificationAction
  | OpenWorkflowEditNotificationAction
  | OpenWorkflowDeleteModalAction
  | CloseWorkflowDeleteModalAction;

// OIDC
export type AddOIDCUserAction = {|
  +type: 'ADD_OIDC_USER',
  +user: AuthUser,
|};

export type OIDCAction = AddOIDCUserAction;

// WORKFLOW
export type SearchWorkflowsSuccessAction = {|
  +type: 'SEARCH_WORKFLOWS_SUCCESS',
  +workflows: APIWorkflows,
|};

export type WorkflowAction = SearchWorkflowsSuccessAction;

// SECRETS

export type AddAccountSecretAction = {|
  +type: 'ADD_ACCOUNT_SECRET',
  +accountName: string,
  +accessKey: AccessKey,
  +secretKey: SecretKey,
|};

export type DeleteAccountSecretAction = {|
  +type: 'DELETE_ACCOUNT_SECRET',
|};

export type SecretsAction = AddAccountSecretAction | DeleteAccountSecretAction;

export type OpenEndpointDeleteDialogAction = {|
  +type: 'OPEN_ENDPOINT_DELETE_DIALOG',
  +hostname: Hostname,
|};

export type CloseEndpointDeleteDialogAction = {|
  +type: 'CLOSE_ENDPOINT_DELETE_DIALOG',
|};

export type EndpointsUIAction =
  | OpenEndpointDeleteDialogAction
  | CloseEndpointDeleteDialogAction;

export type Action =
  | AccountAction
  | AuthAction
  | BucketsUIAction
  | LocationUIAction
  | ObjectsUIAction
  | OIDCAction
  | S3Action
  | ThunkNonStateAction
  | ThunkStatePromisedAction
  | ThunkNonStatePromisedAction
  | EndpointsUIAction
  | ErrorsUIAction
  | SelectInstanceAction
  | SecretsAction
  | NetworkActivityAction
  | ConfigurationAction
  | AccountUIAction
  | SetThemeAction
  | StatsAction
  | WorkflowUIAction
  | WorkflowAction
  | ZenkoAction;
