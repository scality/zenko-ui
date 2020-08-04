// @flow

import type { AccountUIAction } from '../../types/actions';
import type { AccountUIState } from '../../types/state';
import { initialAccountUIState } from './initialConstants';

export default function uiAccount(state: AccountUIState = initialAccountUIState, action: AccountUIAction): AccountUIState {
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
