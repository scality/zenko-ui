import { Account } from './account';
import { OidcLogoutFunction } from './auth';
import { ConfigurationOverlay, Hostname } from './config';
import { AppConfig, InstanceId } from './entities';
import { ManagementClient } from './managementClient';
import { AppState } from './state';
import { InstanceStatus } from './stats';
import { STSClient } from './sts';
import { IamAccessKey } from './user';
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
  | LoadClientsSuccessAction;
// instance status actions
export type InstanceStatusAction = {
  readonly type: 'INSTANCE_STATUS';
  readonly status?: InstanceStatus;
};
export type StatsAction = InstanceStatusAction;

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
  | ThunkNonStateAction
  | ThunkStatePromisedAction
  | ThunkNonStatePromisedAction
  | EndpointsUIAction
  | ErrorsUIAction
  | SelectInstanceAction
  | NetworkActivityAction
  | InstanceStatusAction
  | StatsAction;
