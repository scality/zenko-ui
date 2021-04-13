// @flow
import type { OIDCAction } from '../../types/actions';
import type { ConfigUIState } from '../../types/state';

import { initialConfigUIState } from './initialConstants';

export default function uiConfig(state: ConfigUIState=initialConfigUIState, action: OIDCAction) {
    switch (action.type) {
    case 'SET_THEME':
        return {
            ...state,
            theme: action.theme,
        };
    default:
        return state;
    }
}