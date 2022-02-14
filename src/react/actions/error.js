// @flow

import type {
  ApiError,
  ClearErrorAction,
  DispatchFunction,
  HandleErrorAction,
  ThunkNonStateAction,
} from '../../types/actions';
import type { AWSError } from '../../types/aws';
import type { ErrorViewType } from '../../types/ui';
import { errorParser } from '../utils';
import { networkAuthFailure } from './network';

export function handleApiError(
  error: ApiError,
  errorType: ErrorViewType,
): HandleErrorAction {
  return {
    type: 'HANDLE_ERROR',
    errorMsg: errorParser(error).message,
    errorType,
  };
}

export function handleAWSError(
  error: AWSError,
  errorType: ErrorViewType,
): HandleErrorAction {
  const errorMsg = `${error.message} Prefixes, objects or orphan delete markers are still present.`;

  return {
    type: 'HANDLE_ERROR',
    errorMsg: error.code === 'BucketNotEmpty' ? errorMsg : error.message,
    errorType,
  };
}

export function handleErrorMessage(
  error: string,
  errorType: ErrorViewType,
): HandleErrorAction {
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

export function handleAWSClientError(error: AWSError): ThunkNonStateAction {
  return (dispatch: DispatchFunction) => {
    switch (error.statusCode) {
      case 401:
      case 403:
        dispatch(handleErrorMessage(error.message, 'byAuth'));
        dispatch(networkAuthFailure());
        break;
      default:
        throw error;
    }
  };
}
