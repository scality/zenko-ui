
export default function uiUser(state = { showDelete: false, showSecret: null }, action) {
    switch (action.type) {
    case 'OPEN_USER_DELETE_DIALOG':
        return {
            ...state,
            showDelete: true,
        };
    case 'CLOSE_USER_DELETE_DIALOG':
        return {
            ...state,
            showDelete: false,
        };
    case 'OPEN_SECRET_DIALOG':
        return {
            ...state,
            showSecret: action.keyName,
        };
    case 'CLOSE_SECRET_DIALOG':
        return {
            ...state,
            showSecret: null,
        };
    default:
        return state;
    }
}
