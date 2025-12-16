import { MockSTSClient } from '../../../../js/mock/STSClient';
import { MockManagementClient } from '../../../../js/mock/managementClient';
import {
  CloseAccountDeleteDialogAction,
  CloseEndpointDeleteDialogAction,
  ConfigAuthFailureAction,
  ConfigurationVersionAction,
  HandleErrorAction,
  InstanceStatusAction,
  ListAccountAccessKeySuccessAction,
  LoadClientsSuccessAction,
  LoadConfigSuccessAction,
  NetworkActivityAuthFailureAction,
  NetworkActivityEndAction,
  NetworkActivityStartAction,
  OpenAccountDeleteDialogAction,
  OpenEndpointDeleteDialogAction,
  SelectAccountAction,
  SelectInstanceAction,
  SetAppConfigAction,
  SetManagementClientAction,
  SetOIDCLogoutAction,
  SetSTSClientAction,
  ZenkoClearAction,
  ZenkoErrorAction,
} from '../../../../types/actions';
import { Hostname } from '../../../../types/config';

import { ZenkoClientError } from '../../../../types/zenko';
import {
  ACCOUNT,
  ACCOUNT_ACCESS_KEYS,
  APP_CONFIG,
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
// * zenko actions
export const ZENKO_CLEAR_ERROR_ACTION = (): ZenkoClearAction => {
  return {
    type: 'ZENKO_CLEAR_ERROR',
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
