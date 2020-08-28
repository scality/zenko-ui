// @flow
import type { AppConfig, InstanceId } from './entities';
import type { ConfigurationOverlay, LocationName } from './config';
import type { AppState } from './state';
import type { ErrorViewType } from './ui';
import type { InstanceStatus } from './stats';
import type { ManagementClient } from './managementClient';
import type { S3Client } from './s3Client';
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
    +errorType: ErrorViewType,
|};

export type ErrorsUIAction =
    HandleErrorAction |
    ClearErrorAction |
    NetworkActivityAuthResetAction;

// auth actions

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
  SetManagementClientAction |
  SetUserManagerAction |
  SetAppConfigAction |
  ConfigAuthFailureAction |
  LoadUserSuccessAction |
  SignoutStartAction |
  SignoutEndAction;

// s3 actions
export type S3Action = SetS3ClientAction;

export type SetS3ClientAction = {|
    +type: 'SET_S3_CLIENT',
    +s3Client: S3Client,
|};

// instances actions
export type SelectInstanceAction = {|
    +type: 'SELECT_INSTANCE',
    +selectedId: InstanceId,
|};

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
    SetS3ClientAction |
    AuthAction |
    LocationUIAction |
    ThunkStatePromisedAction |
    ThunkNonStateAction |
    ThunkStatePromisedAction |
    ErrorsUIAction |
    SelectInstanceAction |
    NetworkActivityAction |
    ConfigurationAction |
    AccountUIAction;
