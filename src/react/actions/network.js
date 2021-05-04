// @flow

import type {
    NetworkActivityAuthFailureAction,
    NetworkActivityAuthResetAction,
    NetworkActivityEndAction,
    NetworkActivityStartAction,
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

export function networkStart(message: string): NetworkActivityStartAction {
    return {
        type: 'NETWORK_START',
        message,
    };
}

export function networkEnd(): NetworkActivityEndAction {
    return {
        type: 'NETWORK_END',
    };
}
