// @noflow
import {initialNetworkActivityState} from './initialConstants';

export default function networkActivity(state=initialNetworkActivityState, action) {
    switch (action.type) {
    case 'NETWORK_START':
        return {
            ...state,
            counter: state.counter + 1,
            messages: state.messages.unshift(action.message),
        };
    case 'NETWORK_END':
        return {
            ...state,
            counter: Math.max(state.counter - 1, 0),
            messages: state.messages.shift(),
        };
    case 'NETWORK_AUTH_FAILURE':
        return {
            ...state,
            authFailure: true,
        };
    case 'NETWORK_AUTH_RESET':
        return {
            ...state,
            authFailure: false,
        };
    default:
        return state;
    }
}
