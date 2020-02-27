export default function user(state = { list: [], displayedUser: {}, accessKeyList: [], attachedPoliciesList: [], groupList: []}, action) {
    switch (action.type){
    case 'UPDATE_USER_LIST':
        return {
            ...state,
            list: action.list,
        };
    case 'UPDATE_ACCESS_KEY_LIST':
        return {
            ...state,
            accessKeyList: action.list,
        };
    case 'UPDATE_ATTACHED_USER_POLICIES_LIST':
        return {
            ...state,
            attachedPoliciesList: action.list,
        };
    case 'UPDATE_GROUPS_FOR_USER_LIST':
        return {
            ...state,
            groupList: action.list,
        };
    case 'SHOW_USER':
        return {
            ...state,
            displayedUser: action.user,
        };
    default:
        return state;
    }
}
