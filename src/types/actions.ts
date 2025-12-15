import { AccessKey, Account, SecretKey } from './account';
import { AuthUser, OidcLogoutFunction } from './auth';
import { ConfigurationOverlay, Hostname } from './config';
import { AppConfig, InstanceId } from './entities';
import { ManagementClient } from './managementClient';
import { BucketInfo, S3Bucket } from './s3';
import { AppState } from './state';
import { InstanceStatus } from './stats';
import { STSClient } from './sts';
import { IamAccessKey } from './user';
import { ZenkoClient } from './zenko';
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
export type S3Action = GetBucketInfoSuccessAction | ListBucketsSuccessAction;
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
  | ZenkoErrorAction;
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
// bucket UI actions
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

export type StatsAction = InstanceStatusAction;
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
  | ZenkoAction;
