// @flow

import type { AppConfig, InstanceId } from './entities';
import type { AppState } from './state';
import type { ManagementClient } from './managementClient';
import type { S3Client } from './s3Client';
import type { UserManager } from './auth';

export type ErrorViewType = 'byModal' | 'byComponent' | 'byAuth';

export type DispatchFunction = (Action) => any;
export type GetStateFunction = () => AppState;


export interface ApiError extends Error {
    status: 200 | 401 | 403 | 422 | 500 | 503;
}

export type PromiseAction = Promise<Action>;
export type ThunkStatePromisedAction = (DispatchFunction, GetStateFunction) => Promise<mixed>;
export type ThunkStateAction = (DispatchFunction, GetStateFunction) => void;
export type ThunkNonStatePromisedAction = (DispatchFunction) => Promise<void>;
export type ThunkNonStateAction = (DispatchFunction) => void;

export type ClearErrorAction = {|
    +type: 'CLEAR_ERROR',
|};

export type HandleErrorAction = {|
    +type: 'HANDLE_ERROR',
    +errorMsg: string | void,
    +errorType: ErrorViewType,
|};

// auth actions
export type InitClientsAction = {|
    +type: 'INIT_CLIENTS',
    +managementClient: ManagementClient,
    +s3Client: S3Client,
|};

export type SetUserManagerAction = {|
    +type: 'SET_USER_MANAGER',
    +userManager: UserManager,
|};

export type SetAppConfigAction = {|
    +type: 'SET_APP_CONFIG',
    +config: AppConfig,
|};

export type  SelectInstanceAction = {|
    +type: 'SELECT_INSTANCE',
    +selectedId: InstanceId,
|};

export type  LoadUserSuccessAction = {|
    +type: 'LOAD_USER_SUCCESS',
|};

export type  ConfigAuthFailureAction = {|
    +type: 'CONFIG_AUTH_FAILURE',
|};

export type  SignoutStartAction = {|
    +type: 'SIGNOUT_START',
|};

export type  SignoutEndAction = {|
    +type: 'SIGNOUT_END',
|};

export type NetworkActivityAuthFailureAction = {|
    +type: 'NETWORK_AUTH_FAILURE',
|};

export type NetworkActivityStartAction = {|
    +type: 'NETWORK_START',
    +message: string,
|};

export type NetworkActivityStopAction = {|
    +type: 'NETWORK_END',
|};

export type Action =
    ThunkStatePromisedAction |
    ThunkNonStateAction |
    ThunkStatePromisedAction |
    ClearErrorAction |
    HandleErrorAction |
    InitClientsAction |
    SetUserManagerAction |
    SetAppConfigAction |
    SelectInstanceAction |
    LoadUserSuccessAction |
    ConfigAuthFailureAction |
    SignoutStartAction |
    SignoutEndAction |
    NetworkActivityAuthFailureAction |
    NetworkActivityStartAction |
    NetworkActivityStopAction;
