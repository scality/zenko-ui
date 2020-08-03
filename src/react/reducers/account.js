// @flow
import type { AccountState } from '../../types/state';
import type { DisplayAccountAction } from '../../types/actions';
import { initialAccountState } from './initialConstants';

export default function account(state: AccountState = initialAccountState, action: DisplayAccountAction): AccountState {
    switch (action.type){
    case 'DISPLAY_ACCOUNT':
        return {
            ...state,
            display: action.account,
        };
    default:
        return state;
    }
}
