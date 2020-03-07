// @noflow

export function networkAuthReset() {
    return {
        type: 'NETWORK_AUTH_RESET',
    };
}

export function networkAuthFailure() {
    return {
        type: 'NETWORK_AUTH_FAILURE',
    };
}

export function networkStart(message: string) {
    return {
        type: 'NETWORK_START',
        message,
    };
}

export function networkEnd() {
    return {
        type: 'NETWORK_END',
    };
}
