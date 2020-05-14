export default function auth(state = {}, action) {
    switch (action.type) {
    case 'LOG_IN':
        return {
            ...state,
            apiClient: action.apiClient,
        };
    case 'SET_USER_MANAGER':
        return {
            ...state,
            userManager: action.userManager,
        };
    case 'USER_FOUND':
        return {
            type: 'USER_FOUND',
            user: action.user,
        };
    default:
        return state;
    }
}
