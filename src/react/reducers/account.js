import { initialAccountState } from './initialConstants';

export default function account(state = initialAccountState, action) {
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
