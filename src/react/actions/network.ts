import {
  NetworkActivityAuthFailureAction,
  NetworkActivityAuthResetAction,
} from '../../types/actions';

export function networkAuthReset(): NetworkActivityAuthResetAction {
  return {
    type: 'NETWORK_AUTH_RESET',
  };
}

export function networkAuthFailure(): NetworkActivityAuthFailureAction {
  return {
    type: 'NETWORK_AUTH_FAILURE',
  };
}
