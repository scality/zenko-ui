export default function user(state = { list: [], userShown: {}}, action) {
    switch (action.type){
    case 'UPDATE_USER_LIST':
        return {
            ...state,
            list: action.list,
        };
    case 'SHOW_USER':
        return {
            ...state,
            userShown: action.user,
        };
    default:
        return state;
    }
}
