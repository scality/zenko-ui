// @flow

import {
    APP_CONFIG,
    INSTANCE_ID,
    LATEST_OVERLAY,
} from './testUtil';

import type {
    CloseAccountDeleteDialogAction,
    CloseBucketDeleteDialogAction,
    CloseLocationDeleteDialogAction,
    ConfigAuthFailureAction,
    ConfigurationVersionAction,
    HandleErrorAction,
    ListBucketsSuccessAction,
    LoadUserSuccessAction,
    NetworkActivityAuthFailureAction,
    NetworkActivityEndAction,
    NetworkActivityStartAction,
    OpenAccountDeleteDialogAction,
    OpenBucketDeleteDialogAction,
    OpenLocationDeleteDialogAction,
    SelectInstanceAction,
    SetAppConfigAction,
    SetManagementClientAction,
    SetS3ClientAction,
    SetSTSClientAction,
    SetUserManagerAction,
    SignoutEndAction,
    SignoutStartAction,
} from '../../../../types/actions';
import type { S3Bucket, S3Client as S3ClientInterface } from '../../../../types/s3';

import { CALL_HISTORY_METHOD } from 'connected-react-router';

import type { LocationName } from '../../../../types/config';
import { MockManagementClient } from '../../../../js/mock/managementClient';
import { MockSTSClient } from '../../../../js/mock/STSClient';
import { MockUserManager } from '../../../../js/mock/userManager';

// auth actions
export const SET_MANAGEMENT_CLIENT_ACTION: SetManagementClientAction =
    { type: 'SET_MANAGEMENT_CLIENT', managementClient: new MockManagementClient() };

export function SET_S3_CLIENT_ACTION(s3Client: S3ClientInterface): SetS3ClientAction {
    return { type: 'SET_S3_CLIENT', s3Client };
}

export const SET_STS_CLIENT_ACTION: SetSTSClientAction =
        { type: 'SET_STS_CLIENT', stsClient: new MockSTSClient() };

export const SET_USER_MANAGER_ACTION: SetUserManagerAction =
    { type: 'SET_USER_MANAGER', userManager: new MockUserManager() };

export const SET_APP_CONFIG_ACTION: SetAppConfigAction =
    { type: 'SET_APP_CONFIG', config: APP_CONFIG };

export const SELECT_INSTANCE_ACTION: SelectInstanceAction =
    { type: 'SELECT_INSTANCE', selectedId: INSTANCE_ID };

export const LOAD_USER_SUCCESS_ACTION: LoadUserSuccessAction =
    { type: 'LOAD_USER_SUCCESS' };

export const CONFIG_AUTH_FAILURE_ACTION: ConfigAuthFailureAction =
    { type: 'CONFIG_AUTH_FAILURE' };

export const SIGNOUT_START_ACTION: SignoutStartAction =
    { type: 'SIGNOUT_START' };

export const SIGNOUT_END_ACTION: SignoutEndAction =
    { type: 'SIGNOUT_END' };

// * error action
export function HANDLE_ERROR_MODAL_ACTION(errorMsg: string): HandleErrorAction {
    return { type: 'HANDLE_ERROR', errorMsg, errorType: 'byModal' };
}

export function HANDLE_ERROR_AUTH_ACTION(errorMsg: string): HandleErrorAction {
    return { type: 'HANDLE_ERROR', errorMsg, errorType: 'byAuth' };
}
export function HANDLE_ERROR_SPEC_ACTION(errorMsg: string): HandleErrorAction {
    return { type: 'HANDLE_ERROR', errorMsg, errorType: 'byComponent' };
}

export const LOCATION_PUSH_ACTION = (path: string) => ({
    type: CALL_HISTORY_METHOD, payload: { args: [path], method: 'push' },
});

export const LOCATION_BACK_ACTION = {
    type: CALL_HISTORY_METHOD, payload: { args: [], method: 'goBack' },
};

// * config actions
export const CONFIGURATION_VERSION_ACTION: ConfigurationVersionAction =
    { type: 'CONFIGURATION_VERSION', configuration: LATEST_OVERLAY };

// * network actions
export const NETWORK_START_ACTION =
    (msg: string): NetworkActivityStartAction => ({ type: 'NETWORK_START', message: msg });

export const NETWORK_END_ACTION: NetworkActivityEndAction =
    { type: 'NETWORK_END' };

export const NETWORK_AUTH_FAILURE_ACTION: NetworkActivityAuthFailureAction =
        { type: 'NETWORK_AUTH_FAILURE' };

// * account actions
export const OPEN_ACCOUNT_DELETE_DIALOG_ACTION: OpenAccountDeleteDialogAction =
    { type: 'OPEN_ACCOUNT_DELETE_DIALOG' };

export const CLOSE_ACCOUNT_DELETE_DIALOG_ACTION: CloseAccountDeleteDialogAction =
    { type: 'CLOSE_ACCOUNT_DELETE_DIALOG' };

// * location actions
export const OPEN_LOCATION_DELETE_DIALOG_ACTION =
    (locationName: LocationName): OpenLocationDeleteDialogAction => ({ type: 'OPEN_LOCATION_DELETE_DIALOG', locationName });

export const CLOSE_LOCATION_DELETE_DIALOG_ACTION: CloseLocationDeleteDialogAction =
    { type: 'CLOSE_LOCATION_DELETE_DIALOG' };

// * buckets actions
export const LIST_BUCKETS_SUCCESS_ACTION = (list: Array<S3Bucket>, ownerName: string): ListBucketsSuccessAction =>
    ({ type: 'LIST_BUCKETS_SUCCESS', list: [], ownerName });

export const OPEN_BUCKET_DELETE_DIALOG_ACTION = (bucketName: string): OpenBucketDeleteDialogAction =>
    ({ type: 'OPEN_BUCKET_DELETE_DIALOG', bucketName });

export const CLOSE_BUCKET_DELETE_DIALOG_ACTION: CloseBucketDeleteDialogAction =
    { type: 'CLOSE_BUCKET_DELETE_DIALOG' };
