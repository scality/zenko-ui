import {
  ApiError,
  DispatchFunction,
  HandleErrorAction,
  ThunkNonStateAction,
} from '../../types/actions';
import { AWSError } from 'aws-sdk';
import { ErrorViewType } from '../../types/ui';
import { networkAuthFailure } from './network';

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

export function handleClientError(error: ApiError): ThunkNonStateAction {
  return (dispatch: DispatchFunction) => {
    switch (error.status) {
      case 401:
      case 403:
        dispatch(networkAuthFailure());
        break;
      case 400:
        if (error.message?.includes('token has expired')) {
          dispatch(handleErrorMessage(error.message, 'byAuth'));
          dispatch(networkAuthFailure());
        } else {
          throw error;
        }
        break;

      default:
        throw error;
    }
  };
}

export function handleAWSClientError(error: AWSError): ThunkNonStateAction {
  return (dispatch: DispatchFunction) => {
    if (error.code === 'ExpiredToken') {
      dispatch(handleErrorMessage(error.message, 'byAuth'));
      dispatch(networkAuthFailure());
    } else {
      switch (error.statusCode) {
        case 401:
        case 403:
          dispatch(handleErrorMessage(error.message, 'byAuth'));
          dispatch(networkAuthFailure());
          break;

        default:
          throw error;
      }
    }
  };
}
