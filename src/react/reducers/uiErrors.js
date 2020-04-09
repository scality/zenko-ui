export default function uiErrors(state = { errorMsg: null, errorType: null }, action) {
    switch (action.type) {
    case 'HANDLE_ERROR':
        return {
            ...state,
            errorMsg: action.errorMsg,
            errorType: action.errorType,
        };
    case 'CLEAR_ERROR':
        return {
            ...state,
            errorMsg: null,
            errorType: null,
        };
    case 'NETWORK_AUTH_RESET':
        return {
            ...state,
            errorMsg: null,
            errorType: null,
        };
    default:
        return state;
    }
}
