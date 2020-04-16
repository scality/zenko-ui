import {initialErrorsUIState} from './initialConstants';

export default function uiErrors(state = initialErrorsUIState, action) {
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
