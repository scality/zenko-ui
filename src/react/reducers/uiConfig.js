// @flow
import type { ConfigUIState } from '../../types/state';
import type { SetThemeAction } from '../../types/actions';
import { initialConfigUIState } from './initialConstants';

export default function uiConfig(state: ConfigUIState=initialConfigUIState, action: SetThemeAction) {
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
