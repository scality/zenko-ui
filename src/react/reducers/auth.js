export default function auth(state = { isUserLoaded: false }, action) {
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
    case 'LOAD_USER_SUCCESS':
        return {
            ...state,
            isUserLoaded: true,
        };
    default:
        return state;
    }
}
