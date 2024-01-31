import { MockSTSClient } from '../../../../js/mock/STSClient';
import { MockManagementClient } from '../../../../js/mock/managementClient';
import type {
  CloseAccountDeleteDialogAction,
  CloseBucketDeleteDialogAction,
  CloseEndpointDeleteDialogAction,
  CloseFolderCreateModalAction,
  CloseObjectDeleteModalAction,
  CloseObjectUploadModalAction,
  CloseWorkflowEditNotificationAction,
  ConfigAuthFailureAction,
  ConfigurationVersionAction,
  GetBucketInfoSuccessAction,
  GetObjectMetadataSuccessAction,
  HandleErrorAction,
  InstanceStatusAction,
  ListAccountAccessKeySuccessAction,
  ListObjectsSuccessAction,
  LoadClientsSuccessAction,
  LoadConfigSuccessAction,
  NetworkActivityAuthFailureAction,
  NetworkActivityEndAction,
  NetworkActivityStartAction,
  OpenAccountDeleteDialogAction,
  OpenBucketDeleteDialogAction,
  OpenEndpointDeleteDialogAction,
  OpenFolderCreateModalAction,
  OpenObjectDeleteModalAction,
  OpenObjectUploadModalAction,
  OpenWorkflowEditNotificationAction,
  ResetObjectMetadataAction,
  SelectAccountAction,
  SelectInstanceAction,
  SetAppConfigAction,
  SetManagementClientAction,
  SetOIDCLogoutAction,
  SetSTSClientAction,
  SetZenkoClientAction,
  ToggleAllObjectsAction,
  ToggleObjectAction,
  ZenkoAppendSearchListAction,
  ZenkoClearAction,
  ZenkoErrorAction,
  ZenkoWriteSearchListAction,
} from '../../../../types/actions';
import type { Hostname } from '../../../../types/config';
import type {
  CommonPrefix,
  HeadObjectResponse,
  RetentionMode,
  S3Object,
  TagSet,
} from '../../../../types/s3';
import type {
  Marker,
  SearchResultList,
  ZenkoClientError,
  ZenkoClient as ZenkoClientInterface,
} from '../../../../types/zenko';
import {
  ACCOUNT,
  ACCOUNT_ACCESS_KEYS,
  APP_CONFIG,
  BUCKET_INFO_RESPONSE,
  INSTANCE_ID,
  INSTANCE_STATUS_RUNNINGv1,
  INSTANCE_STATUS_RUNNINGv2,
  LATEST_OVERLAY,
  LOGOUT_MOCK,
} from './testUtil';
// auth actions
export const SET_MANAGEMENT_CLIENT_ACTION: SetManagementClientAction = {
  type: 'SET_MANAGEMENT_CLIENT',
  //@ts-expect-error fix this when you are working on it
  managementClient: new MockManagementClient(),
};
export function SET_ZENKO_CLIENT_ACTION(
  zenkoClient: ZenkoClientInterface,
): SetZenkoClientAction {
  return {
    type: 'SET_ZENKO_CLIENT',
    zenkoClient,
  };
}
export const SET_STS_CLIENT_ACTION: SetSTSClientAction = {
  type: 'SET_STS_CLIENT',
  stsClient: new MockSTSClient(),
};
export const SET_APP_CONFIG_ACTION: SetAppConfigAction = {
  type: 'SET_APP_CONFIG',
  //@ts-expect-error fix this when you are working on it
  config: APP_CONFIG,
};
export const SELECT_INSTANCE_ACTION: SelectInstanceAction = {
  type: 'SELECT_INSTANCE',
  selectedId: INSTANCE_ID,
};
export const LOAD_CONFIG_SUCCESS_ACTION: LoadConfigSuccessAction = {
  type: 'LOAD_CONFIG_SUCCESS',
};
export const LOAD_CLIENTS_SUCCESS_ACTION: LoadClientsSuccessAction = {
  type: 'LOAD_CLIENTS_SUCCESS',
};
export const CONFIG_AUTH_FAILURE_ACTION: ConfigAuthFailureAction = {
  type: 'CONFIG_AUTH_FAILURE',
};
export const SELECT_ACCOUNT_ACTION: SelectAccountAction = {
  type: 'SELECT_ACCOUNT',
  account: ACCOUNT,
};
export const SET_OIDC_LOGOUT_ACTION: SetOIDCLogoutAction = {
  type: 'SET_OIDC_LOGOUT',
  logout: LOGOUT_MOCK,
};
// * account action
export const LIST_ACCOUNT_ACCESS_KEY_SUCCESS_ACTION: ListAccountAccessKeySuccessAction =
  {
    type: 'LIST_ACCOUNT_ACCESS_KEY_SUCCESS',
    accessKeys: ACCOUNT_ACCESS_KEYS,
  };
// * error action
export function HANDLE_ERROR_MODAL_ACTION(errorMsg: string): HandleErrorAction {
  return {
    type: 'HANDLE_ERROR',
    errorMsg,
    errorType: 'byModal',
  };
}
export function HANDLE_ERROR_AUTH_ACTION(errorMsg: string): HandleErrorAction {
  return {
    type: 'HANDLE_ERROR',
    errorMsg,
    errorType: 'byAuth',
  };
}
export function HANDLE_ERROR_SPEC_ACTION(errorMsg: string): HandleErrorAction {
  return {
    type: 'HANDLE_ERROR',
    errorMsg,
    errorType: 'byComponent',
  };
}
export const ZENKO_HANDLE_ERROR_ACTION = (
  error: ZenkoClientError,
  target: string | null,
  type: string | null,
): ZenkoErrorAction => ({
  type: 'ZENKO_HANDLE_ERROR',
  errorMsg: error.message || null,
  errorCode: error.code || null,
  errorType: type,
  errorTarget: target,
});

// * config actions
export const CONFIGURATION_VERSION_ACTION: ConfigurationVersionAction = {
  type: 'CONFIGURATION_VERSION',
  configuration: LATEST_OVERLAY,
};
// * network actions
export const NETWORK_START_ACTION = (
  msg: string,
): NetworkActivityStartAction => ({
  type: 'NETWORK_START',
  message: msg,
});
export const NETWORK_END_ACTION: NetworkActivityEndAction = {
  type: 'NETWORK_END',
};
export const NETWORK_AUTH_FAILURE_ACTION: NetworkActivityAuthFailureAction = {
  type: 'NETWORK_AUTH_FAILURE',
};
// * account actions
export const OPEN_ACCOUNT_DELETE_DIALOG_ACTION: OpenAccountDeleteDialogAction =
  {
    type: 'OPEN_ACCOUNT_DELETE_DIALOG',
  };
export const CLOSE_ACCOUNT_DELETE_DIALOG_ACTION: CloseAccountDeleteDialogAction =
  {
    type: 'CLOSE_ACCOUNT_DELETE_DIALOG',
  };

// * endpoint actions
export const OPEN_ENDPOINT_DELETE_DIALOG_ACTION = (
  hostname: Hostname,
): OpenEndpointDeleteDialogAction => ({
  type: 'OPEN_ENDPOINT_DELETE_DIALOG',
  hostname,
});
export const CLOSE_ENDPOINT_DELETE_DIALOG_ACTION: CloseEndpointDeleteDialogAction =
  {
    type: 'CLOSE_ENDPOINT_DELETE_DIALOG',
  };
// * buckets actions

export const OPEN_BUCKET_DELETE_DIALOG_ACTION = (
  bucketName: string,
): OpenBucketDeleteDialogAction => ({
  type: 'OPEN_BUCKET_DELETE_DIALOG',
  bucketName,
});
export const CLOSE_BUCKET_DELETE_DIALOG_ACTION: CloseBucketDeleteDialogAction =
  {
    type: 'CLOSE_BUCKET_DELETE_DIALOG',
  };
export const GET_BUCKET_INFO_SUCCESS_ACTION: GetBucketInfoSuccessAction = {
  type: 'GET_BUCKET_INFO_SUCCESS',
  info: BUCKET_INFO_RESPONSE,
};
// * objects actions
export const LIST_OBJECTS_SUCCESS_ACTION = (
  contents: Array<S3Object>,
  commonPrefixes: Array<CommonPrefix>,
  prefix: string,
  nextContinuationToken: Marker,
): ListObjectsSuccessAction => {
  return {
    type: 'LIST_OBJECTS_SUCCESS',
    contents,
    commonPrefixes,
    prefix,
    nextMarker: nextContinuationToken,
  };
};
export const OPEN_FOLDER_CREATE_MODAL_ACTION =
  (): OpenFolderCreateModalAction => {
    return {
      type: 'OPEN_FOLDER_CREATE_MODAL',
    };
  };
export const CLOSE_FOLDER_CREATE_MODAL_ACTION =
  (): CloseFolderCreateModalAction => {
    return {
      type: 'CLOSE_FOLDER_CREATE_MODAL',
    };
  };
export const OPEN_OBJECT_UPLOAD_MODAL_ACTION =
  (): OpenObjectUploadModalAction => {
    return {
      type: 'OPEN_OBJECT_UPLOAD_MODAL',
    };
  };
export const CLOSE_OBJECT_UPLOAD_MODAL_ACTION =
  (): CloseObjectUploadModalAction => {
    return {
      type: 'CLOSE_OBJECT_UPLOAD_MODAL',
    };
  };
export const OPEN_OBJECT_DELETE_MODAL_ACTION =
  (): OpenObjectDeleteModalAction => {
    return {
      type: 'OPEN_OBJECT_DELETE_MODAL',
    };
  };
export const CLOSE_OBJECT_DELETE_MODAL_ACTION =
  (): CloseObjectDeleteModalAction => {
    return {
      type: 'CLOSE_OBJECT_DELETE_MODAL',
    };
  };
export const TOGGLE_OBJECT_ACTION = (objectKey: string): ToggleObjectAction => {
  return {
    type: 'TOGGLE_OBJECT',
    objectKey,
  };
};
export const TOGGLE_ALL_OBJECTS_ACTION = (
  toggled: boolean,
): ToggleAllObjectsAction => {
  return {
    type: 'TOGGLE_ALL_OBJECTS',
    toggled,
  };
};
export const RESET_OBJECT_METADATA_ACTION = (): ResetObjectMetadataAction => {
  return {
    type: 'RESET_OBJECT_METADATA',
  };
};
export const GET_OBJECT_METADATA_SUCCESS_ACTION = (
  bucketName: string,
  objectKey: string,
  info: HeadObjectResponse,
  tags: TagSet,
  ObjectRetention: {
    Mode: RetentionMode;
    RetainUntilDate: Date;
  },
  isLegalHoldEnabled: boolean,
): GetObjectMetadataSuccessAction => {
  return {
    type: 'GET_OBJECT_METADATA_SUCCESS',
    bucketName,
    objectKey,
    info,
    tags,
    ObjectRetention,
    isLegalHoldEnabled,
  };
};
// * zenko actions
export const ZENKO_CLEAR_ERROR_ACTION = (): ZenkoClearAction => {
  return {
    type: 'ZENKO_CLEAR_ERROR',
  };
};
export const ZENKO_CLIENT_WRITE_SEARCH_LIST_ACTION = (
  nextMarker: Marker,
  list: SearchResultList,
): ZenkoWriteSearchListAction => {
  return {
    type: 'ZENKO_CLIENT_WRITE_SEARCH_LIST',
    nextMarker,
    list,
  };
};
export const ZENKO_CLIENT_APPEND_SEARCH_LIST_ACTION = (
  nextMarker: Marker,
  list: SearchResultList,
): ZenkoAppendSearchListAction => {
  return {
    type: 'ZENKO_CLIENT_APPEND_SEARCH_LIST',
    nextMarker,
    list,
  };
};
// workflow actions
export const OPEN_WORKFLOW_EDIT_NOTIFICATION_ACTION =
  (): OpenWorkflowEditNotificationAction => {
    return {
      type: 'OPEN_WORKFLOW_EDIT_NOTIFICATION',
    };
  };
export const CLOSE_WORKFLOW_EDIT_NOTIFICATION_ACTION =
  (): CloseWorkflowEditNotificationAction => {
    return {
      type: 'CLOSE_WORKFLOW_EDIT_NOTIFICATION',
    };
  };
// instance status actions
export const INSTANCE_STATUS_ACTION_RUNNINGv1: InstanceStatusAction = {
  type: 'INSTANCE_STATUS',
  status: INSTANCE_STATUS_RUNNINGv1,
};
export const INSTANCE_STATUS_ACTION_RUNNINGv2: InstanceStatusAction = {
  type: 'INSTANCE_STATUS',
  status: INSTANCE_STATUS_RUNNINGv2,
};
