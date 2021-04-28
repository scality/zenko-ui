// @flow

import type { AccountUIAction } from '../../types/actions';
import type { AccountsUIState } from '../../types/state';
import { initialAccountsUIState } from './initialConstants';

export default function uiAccounts(state: AccountsUIState = initialAccountsUIState, action: AccountUIAction): AccountsUIState {
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
    case 'OPEN_ACCOUNT_KEY_CREATE_MODAL':
        return {
            ...state,
            showKeyCreate: true,
        };
    case 'CLOSE_ACCOUNT_KEY_CREATE_MODAL':
        return {
            ...state,
            showKeyCreate: false,
        };
    default:
        return state;
    }
}
