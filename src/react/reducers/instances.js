import { initialInstancesState } from './initialConstants';

export default function instances(state = {}, action) {
    switch (action.type){
    case 'SELECT_INSTANCE':
        return {
            ...state,
            selectedId: action.selectedId,
        };
    default:
        return state;
    }
}
