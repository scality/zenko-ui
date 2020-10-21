// @flow

import type { AppConfig, InstanceId } from './entities';
import type { CommonPrefix, HeadObjectResponse, S3Bucket, S3Object, TagSet } from './s3';
import type { ConfigurationOverlay, LocationName } from './config';
import type { Marker, SearchResultList, ZenkoClient } from './zenko';
import type { AppState } from './state';
import type { FailureType } from './ui';
import type { InstanceStatus } from './stats';
import type { ManagementClient } from './managementClient';
import type { STSClient } from './sts';
import type { UserManager } from './auth';

export type DispatchFunction = (Action) => any;
export type GetStateFunction = () => AppState;

export interface ApiError extends Error {
    status: 200 | 401 | 403 | 422 | 500 | 503;
}

export interface S3Error extends Error {
    statusCode: 200 | 401 | 403 | 422 | 500 | 503;
}

export type PromiseAction = Promise<Action>;
export type ThunkStatePromisedAction = (DispatchFunction, GetStateFunction) => Promise<mixed>;
export type ThunkStateAction = (DispatchFunction, GetStateFunction) => void;
export type ThunkNonStatePromisedAction = (DispatchFunction) => Promise<void>;
export type ThunkNonStateAction = (DispatchFunction) => void;

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
    HandleErrorAction |
    ClearErrorAction |
    NetworkActivityAuthResetAction;

// auth actions
export type SetSTSClientAction = {|
    +type: 'SET_STS_CLIENT',
    +stsClient: STSClient,
|};

export type SetManagementClientAction = {|
    +type: 'SET_MANAGEMENT_CLIENT',
    +managementClient: ManagementClient,
|};

export type SetUserManagerAction = {|
    +type: 'SET_USER_MANAGER',
    +userManager: UserManager,
|};

export type SetAppConfigAction = {|
    +type: 'SET_APP_CONFIG',
    +config: AppConfig,
|};

export type ConfigAuthFailureAction = {|
    +type: 'CONFIG_AUTH_FAILURE',
|};

export type LoadUserSuccessAction = {|
    +type: 'LOAD_USER_SUCCESS',
|};

export type SignoutStartAction = {|
    +type: 'SIGNOUT_START',
|};

export type SignoutEndAction = {|
    +type: 'SIGNOUT_END',
|};

export type AuthAction =
  SetSTSClientAction |
  SetManagementClientAction |
  SetUserManagerAction |
  SetAppConfigAction |
  ConfigAuthFailureAction |
  LoadUserSuccessAction |
  SignoutStartAction |
  SignoutEndAction;

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

export type ToggleObjectAction = {|
    +type: 'TOGGLE_OBJECT',
    +objectName: string,
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
|};

export type GetObjectMetadataSuccessAction = {|
    +type: 'GET_OBJECT_METADATA_SUCCESS',
    +bucketName: string,
    +prefixWithSlash: string,
    +objectKey: string,
    +info: HeadObjectResponse,
    +tags: TagSet,
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
    ListBucketsSuccessAction |
    ListObjectsSuccessAction |
    GetObjectMetadataSuccessAction |
    ResetObjectMetadataAction |
    ToggleAllObjectsAction |
    ToggleObjectAction |
    ZenkoWriteSearchListAction |
    ZenkoAppendSearchListAction;

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

export type ZenkoAction = SetZenkoClientAction |
    ZenkoClearAction |
    ZenkoErrorAction |
    ZenkoWriteSearchListAction |
    ListObjectsSuccessAction;

// ui buckets actions
export type OpenBucketDeleteDialogAction = {|
    +type: 'OPEN_BUCKET_DELETE_DIALOG',
    +bucketName: string,
|};

export type CloseBucketDeleteDialogAction = {|
    +type: 'CLOSE_BUCKET_DELETE_DIALOG',
|};

export type BucketsUIAction =
    OpenBucketDeleteDialogAction |
    CloseBucketDeleteDialogAction;

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
    OpenFolderCreateModalAction |
    CloseFolderCreateModalAction |
    OpenObjectUploadModalAction |
    CloseObjectUploadModalAction |
    OpenObjectDeleteModalAction |
    CloseObjectDeleteModalAction;

// networkActivity actions
export type NetworkActivityAuthFailureAction = {|
    +type: 'NETWORK_AUTH_FAILURE',
    +failureType?: FailureType,
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

export type NetworkActivityAction = NetworkActivityAuthFailureAction |
    NetworkActivityStartAction |
    NetworkActivityEndAction |
    NetworkActivityAuthResetAction;

// configuration actions
export type InstanceStatusAction = {|
    +type: 'INSTANCE_STATUS',
    +status: InstanceStatus,
|};

export type ConfigurationVersionAction = {|
    +type: 'CONFIGURATION_VERSION',
    +configuration: ConfigurationOverlay,
|};

export type ConfigurationAction = InstanceStatusAction | ConfigurationVersionAction;

export type OpenAccountDeleteDialogAction = {|
    +type: 'OPEN_ACCOUNT_DELETE_DIALOG',
|};

export type CloseAccountDeleteDialogAction = {|
    +type: 'CLOSE_ACCOUNT_DELETE_DIALOG',
|};

export type AccountUIAction = OpenAccountDeleteDialogAction | CloseAccountDeleteDialogAction;

export type OpenLocationDeleteDialogAction = {|
    +type: 'OPEN_LOCATION_DELETE_DIALOG',
    +locationName: LocationName,
|};

export type CloseLocationDeleteDialogAction = {|
    +type: 'CLOSE_LOCATION_DELETE_DIALOG',
|};

export type LocationUIAction = OpenLocationDeleteDialogAction | CloseLocationDeleteDialogAction;

export type Action =
    AuthAction |
    BucketsUIAction |
    LocationUIAction |
    ObjectsUIAction |
    S3Action |
    ThunkStatePromisedAction |
    ThunkNonStateAction |
    ThunkStatePromisedAction |
    ErrorsUIAction |
    SelectInstanceAction |
    NetworkActivityAction |
    ConfigurationAction |
    AccountUIAction |
    ZenkoAction;
