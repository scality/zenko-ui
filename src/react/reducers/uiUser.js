
export default function uiUser(state = { showDelete: false }, action) {
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
    default:
        return state;
    }
}
