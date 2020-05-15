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
    case 'SET_CONFIG':
        return {
            ...state,
            config: action.config,
        };
    case 'USER_FOUND':
        return {
            ...state,
            user: action.user,
        };
    default:
        return state;
    }
}
