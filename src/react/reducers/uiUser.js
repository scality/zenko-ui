import { initialUserUIState } from './initialConstants';

export default function uiUser(state = initialUserUIState, action) {
    switch (action.type) {
    case 'OPEN_USER_DELETE_DIALOG':
        return {
            ...state,
            showDelete: true,
        };
    case 'CLOSE_USER_DELETE_DIALOG':
        return {
            ...state,
            showDelete: false,
        };

    case 'OPEN_KEY_DELETE_DIALOG':
        return {
            ...state,
            showDeleteKey: action.accessKey,
        };
    case 'CLOSE_KEY_DELETE_DIALOG':
        return {
            ...state,
            showDeleteKey: null,
        };
    case 'OPEN_SECRET_DIALOG':
        return {
            ...state,
            showSecret: action.accessKey,
        };
    case 'CLOSE_SECRET_DIALOG':
        return {
            ...state,
            showSecret: null,
        };
    default:
        return state;
    }
}
