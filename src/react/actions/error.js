// @flow

import type {
    ApiError,
    ClearErrorAction,
    DispatchFunction,
    HandleErrorAction,
    S3Error,
    ThunkNonStateAction,
} from '../../types/actions';
import type { ErrorViewType, FailureType } from '../../types/ui';
import { errorParser } from '../utils';
import { networkAuthFailure } from './network';

export const S3_FAILURE_TYPE: FailureType = 's3';

export function handleApiError(error: ApiError, errorType: ErrorViewType): HandleErrorAction {
    return {
        type: 'HANDLE_ERROR',
        errorMsg: errorParser(error).message,
        errorType,
    };
}

export function handleErrorMessage(error: string, errorType: ErrorViewType): HandleErrorAction {
    return {
        type: 'HANDLE_ERROR',
        errorMsg: error,
        errorType,
    };
}

export function clearError(): ClearErrorAction {
    return { type: 'CLEAR_ERROR' };
}

export function handleClientError(error: ApiError): ThunkNonStateAction {
    return (dispatch: DispatchFunction) => {
        switch (error.status) {
        case 401:
        case 403:
            dispatch(networkAuthFailure());
            break;
        default:
            throw error;
        }
    };
}

export function handleS3Error(error: S3Error): ThunkNonStateAction {
    return (dispatch: DispatchFunction) => {
        switch (error.statusCode) {
        case 401:
        case 403:
            dispatch(networkAuthFailure(S3_FAILURE_TYPE));
            break;
        default:
            throw error;
        }
    };
}
