import { initialAccountUIState } from './initialConstants';

export default function uiAccount(state = initialAccountUIState, action) {
    switch (action.type) {
    case 'OPEN_ACCOUNT_DELETE_DIALOG':
        return {
            ...state,
            showDelete: true,
        };
    case 'CLOSE_ACCOUNT_DELETE_DIALOG':
        return {
            ...state,
            showDelete: false,
        };
    default:
        return state;
    }
}
