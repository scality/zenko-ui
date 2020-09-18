// @flow

import type {
    NetworkActivityAuthFailureAction,
    NetworkActivityAuthResetAction,
    NetworkActivityEndAction,
    NetworkActivityStartAction,
} from '../../types/actions';
import type { FailureType } from '../../types/ui';

export function networkAuthReset(): NetworkActivityAuthResetAction {
    return {
        type: 'NETWORK_AUTH_RESET',
    };
}

export function networkAuthFailure(failureType?: FailureType): NetworkActivityAuthFailureAction {
    return {
        type: 'NETWORK_AUTH_FAILURE',
        failureType,
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
