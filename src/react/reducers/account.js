import {initialAccountState} from './initialConstants';

export default function account(state = initialAccountState, action) {
    switch (action.type){
    case 'LIST_ACCOUNTS_SUCCESS':
        return {
            ...state,
            list: action.list,
            isTruncated: action.isTruncated,
            marker: action.marker,
        };
    default:
        return state;
    }
}
