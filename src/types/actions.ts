import type { AccessKey, Account, SecretKey } from './account';
import type { AuthUser, OidcLogoutFunction } from './auth';
import type { ConfigurationOverlay, Hostname } from './config';
import type { AppConfig, InstanceId } from './entities';
import type { ManagementClient } from './managementClient';
import type {
  BucketInfo,
  CommonPrefix,
  HeadObjectResponse,
  RetentionMode,
  S3Bucket,
  S3DeleteMarker,
  S3Object,
  S3Version,
  TagSet,
} from './s3';
import type { AppState } from './state';
import type { InstanceStatus } from './stats';
import type { STSClient } from './sts';
import type { IamAccessKey } from './user';
import type { Marker, SearchResultList, ZenkoClient } from './zenko';
export type DispatchFunction = (arg0: Action) => any;
export type GetStateFunction = () => AppState;
export interface ApiError extends Error {
  status: 200 | 400 | 401 | 403 | 422 | 500 | 503;
}
export type PromiseAction = Promise<Action>;
export type ThunkStatePromisedAction = (
  arg0: DispatchFunction,
  arg1: GetStateFunction,
) => Promise<unknown>;
export type ThunkStateAction = (
  arg0: DispatchFunction,
  arg1: GetStateFunction,
) => void;
export type ThunkNonStatePromisedAction = (
  arg0: DispatchFunction,
) => Promise<void>;
export type ThunkNonStateAction = (arg0: DispatchFunction) => void;
// error action
export type ClearErrorAction = {
  readonly type: 'CLEAR_ERROR';
};
export type HandleErrorAction = {
  readonly type: 'HANDLE_ERROR';
  readonly errorMsg: string | void;
  readonly errorType: string | null;
};
export type ErrorsUIAction =
  | HandleErrorAction
  | ClearErrorAction
  | NetworkActivityAuthResetAction;
// auth actions
export type SetSTSClientAction = {
  readonly type: 'SET_STS_CLIENT';
  readonly stsClient: STSClient;
};
export type SetManagementClientAction = {
  readonly type: 'SET_MANAGEMENT_CLIENT';
  readonly managementClient: ManagementClient;
};
export type SetAppConfigAction = {
  readonly type: 'SET_APP_CONFIG';
  readonly config: AppConfig;
};
export type ConfigAuthFailureAction = {
  readonly type: 'CONFIG_AUTH_FAILURE';
};
export type LoadConfigSuccessAction = {
  readonly type: 'LOAD_CONFIG_SUCCESS';
};
export type LoadClientsSuccessAction = {
  readonly type: 'LOAD_CLIENTS_SUCCESS';
};
export type SelectAccountAction = {
  readonly type: 'SELECT_ACCOUNT';
  readonly account: Account;
};
export type SetOIDCLogoutAction = {
  readonly type: 'SET_OIDC_LOGOUT';
  readonly logout: OidcLogoutFunction | null;
};
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
export type ListAccountAccessKeySuccessAction = {
  readonly type: 'LIST_ACCOUNT_ACCESS_KEY_SUCCESS';
  readonly accessKeys: Array<IamAccessKey>;
};
export type AccountAction = ListAccountAccessKeySuccessAction;
// instances actions
export type SelectInstanceAction = {
  readonly type: 'SELECT_INSTANCE';
  readonly selectedId: InstanceId;
};
// s3 actions
export type ListBucketsSuccessAction = {
  readonly type: 'LIST_BUCKETS_SUCCESS';
  readonly list: Array<S3Bucket>;
  readonly ownerName: string;
};
export type GetBucketInfoSuccessAction = {
  readonly type: 'GET_BUCKET_INFO_SUCCESS';
  readonly info: BucketInfo;
};
export type ToggleObjectAction = {
  readonly type: 'TOGGLE_OBJECT';
  readonly objectKey: string;
  readonly versionId?: string;
};
export type ToggleAllObjectsAction = {
  readonly type: 'TOGGLE_ALL_OBJECTS';
  readonly toggled: boolean;
};
export type ListObjectsSuccessAction = {
  readonly type: 'LIST_OBJECTS_SUCCESS';
  readonly contents: Array<S3Object>;
  readonly commonPrefixes: Array<CommonPrefix>;
  readonly prefix: string;
  readonly nextMarker: Marker;
};
export type ContinueListObjectsSuccessAction = {
  readonly type: 'CONTINUE_LIST_OBJECTS_SUCCESS';
  readonly contents: Array<S3Object>;
  readonly commonPrefixes: Array<CommonPrefix>;
  readonly prefix: string;
  readonly nextMarker: Marker;
};
export type ListObjectVersionsSuccessAction = {
  readonly type: 'LIST_OBJECT_VERSIONS_SUCCESS';
  readonly versions: Array<S3Version>;
  readonly deleteMarkers: Array<S3DeleteMarker>;
  readonly commonPrefixes: Array<CommonPrefix>;
  readonly prefix: string;
  readonly nextMarker: Marker;
  readonly nextVersionIdMarker: Marker;
};
export type ContinueListObjectVersionsSuccessAction = {
  readonly type: 'CONTINUE_LIST_OBJECT_VERSIONS_SUCCESS';
  readonly versions: Array<S3Version>;
  readonly deleteMarkers: Array<S3DeleteMarker>;
  readonly commonPrefixes: Array<CommonPrefix>;
  readonly prefix: string;
  readonly nextMarker: Marker;
  readonly nextVersionIdMarker: Marker;
};
export type GetObjectMetadataSuccessAction = {
  readonly type: 'GET_OBJECT_METADATA_SUCCESS';
  readonly bucketName: string;
  readonly objectKey: string;
  readonly info: HeadObjectResponse;
  readonly tags: TagSet;
  readonly ObjectRetention: {
    Mode: RetentionMode;
    RetainUntilDate: Date;
  };
  readonly isLegalHoldEnabled?: boolean;
};
export type ResetObjectMetadataAction = {
  readonly type: 'RESET_OBJECT_METADATA';
};
export type ZenkoWriteSearchListAction = {
  readonly type: 'ZENKO_CLIENT_WRITE_SEARCH_LIST';
  readonly nextMarker: Marker;
  readonly list: SearchResultList;
};
export type ZenkoAppendSearchListAction = {
  readonly type: 'ZENKO_CLIENT_APPEND_SEARCH_LIST';
  readonly nextMarker: Marker;
  readonly list: SearchResultList;
};
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
export type SetZenkoClientAction = {
  readonly type: 'SET_ZENKO_CLIENT';
  readonly zenkoClient: ZenkoClient;
};
export type ZenkoClearAction = {
  readonly type: 'ZENKO_CLEAR_ERROR';
};
export type ZenkoErrorAction = {
  readonly type: 'ZENKO_HANDLE_ERROR';
  readonly errorMsg: string | null;
  readonly errorCode: string | number | null;
  readonly errorType: string | null;
  readonly errorTarget: string | null;
};
export type ZenkoAction =
  | SetZenkoClientAction
  | ZenkoClearAction
  | ZenkoErrorAction
  | ZenkoWriteSearchListAction
  | ZenkoAppendSearchListAction
  | ListObjectsSuccessAction;
// ui buckets actions
export type OpenBucketDeleteDialogAction = {
  readonly type: 'OPEN_BUCKET_DELETE_DIALOG';
  readonly bucketName: string;
};
export type CloseBucketDeleteDialogAction = {
  readonly type: 'CLOSE_BUCKET_DELETE_DIALOG';
};
export type BucketsUIAction =
  | OpenBucketDeleteDialogAction
  | CloseBucketDeleteDialogAction;
// ui objects actions
export type OpenFolderCreateModalAction = {
  readonly type: 'OPEN_FOLDER_CREATE_MODAL';
};
export type CloseFolderCreateModalAction = {
  readonly type: 'CLOSE_FOLDER_CREATE_MODAL';
};
export type OpenObjectUploadModalAction = {
  readonly type: 'OPEN_OBJECT_UPLOAD_MODAL';
};
export type CloseObjectUploadModalAction = {
  readonly type: 'CLOSE_OBJECT_UPLOAD_MODAL';
};
export type OpenObjectDeleteModalAction = {
  readonly type: 'OPEN_OBJECT_DELETE_MODAL';
};
export type CloseObjectDeleteModalAction = {
  readonly type: 'CLOSE_OBJECT_DELETE_MODAL';
};
export type ObjectsUIAction =
  | OpenFolderCreateModalAction
  | CloseFolderCreateModalAction
  | OpenObjectUploadModalAction
  | CloseObjectUploadModalAction
  | OpenObjectDeleteModalAction
  | CloseObjectDeleteModalAction;
// networkActivity actions
export type NetworkActivityAuthFailureAction = {
  readonly type: 'NETWORK_AUTH_FAILURE';
};
export type NetworkActivityStartAction = {
  readonly type: 'NETWORK_START';
  readonly message: string;
};
export type NetworkActivityEndAction = {
  readonly type: 'NETWORK_END';
};
export type NetworkActivityAuthResetAction = {
  readonly type: 'NETWORK_AUTH_RESET';
};
export type NetworkActivityAction =
  | NetworkActivityAuthFailureAction
  | NetworkActivityStartAction
  | NetworkActivityEndAction
  | NetworkActivityAuthResetAction
  | AddOIDCUserAction
  | LoadClientsSuccessAction;
// configuration actions
export type InstanceStatusAction = {
  readonly type: 'INSTANCE_STATUS';
  readonly status?: InstanceStatus;
};
export type ConfigurationVersionAction = {
  readonly type: 'CONFIGURATION_VERSION';
  readonly configuration: ConfigurationOverlay;
};
export type ConfigurationAction =
  | InstanceStatusAction
  | ConfigurationVersionAction;
// account UI actions
export type OpenAccountDeleteDialogAction = {
  readonly type: 'OPEN_ACCOUNT_DELETE_DIALOG';
};
export type CloseAccountDeleteDialogAction = {
  readonly type: 'CLOSE_ACCOUNT_DELETE_DIALOG';
};
export type OpenAccountKeyCreateModalAction = {
  readonly type: 'OPEN_ACCOUNT_KEY_CREATE_MODAL';
};
export type CloseAccountKeyCreateModalAction = {
  readonly type: 'CLOSE_ACCOUNT_KEY_CREATE_MODAL';
};
export type AccountUIAction =
  | OpenAccountDeleteDialogAction
  | CloseAccountDeleteDialogAction
  | OpenAccountKeyCreateModalAction
  | CloseAccountKeyCreateModalAction;

export type StatsAction = InstanceStatusAction;
export type CloseWorkflowEditNotificationAction = {
  readonly type: 'CLOSE_WORKFLOW_EDIT_NOTIFICATION';
};
export type OpenWorkflowEditNotificationAction = {
  readonly type: 'OPEN_WORKFLOW_EDIT_NOTIFICATION';
};
export type WorkflowUIAction =
  | CloseWorkflowEditNotificationAction
  | OpenWorkflowEditNotificationAction;
// OIDC
export type AddOIDCUserAction = {
  readonly type: 'ADD_OIDC_USER';
  readonly user: AuthUser;
};
export type OIDCAction = AddOIDCUserAction;
// SECRETS
export type AddAccountSecretAction = {
  readonly type: 'ADD_ACCOUNT_SECRET';
  readonly userName: string;
  readonly accessKey: AccessKey;
  readonly secretKey: SecretKey;
};
export type DeleteAccountSecretAction = {
  readonly type: 'DELETE_ACCOUNT_SECRET';
};
export type SecretsAction = AddAccountSecretAction | DeleteAccountSecretAction;
export type OpenEndpointDeleteDialogAction = {
  readonly type: 'OPEN_ENDPOINT_DELETE_DIALOG';
  readonly hostname: Hostname;
};
export type CloseEndpointDeleteDialogAction = {
  readonly type: 'CLOSE_ENDPOINT_DELETE_DIALOG';
};
export type EndpointsUIAction =
  | OpenEndpointDeleteDialogAction
  | CloseEndpointDeleteDialogAction;
export type Action =
  | AccountAction
  | AuthAction
  | BucketsUIAction
  //@ts-expect-error fix this when you are working on it
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
  | StatsAction
  | WorkflowUIAction
  | ZenkoAction;
