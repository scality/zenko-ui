import {initialUIState} from './initialConstants';

export default function uiErrors(state = initialUIState, action) {
    switch (action.type) {
    case 'UI_LOADED':
        return {
            ...state,
            loaded: true,
        };
    default:
        return state;
    }
}
