export default function auth(state = { isUserLoaded: false }, action) {
    switch (action.type) {
    case 'INIT_CLIENTS':
        console.log('action!!!', action);
        return {
            ...state,
            managementClient: action.managementClient,
            s3Client: action.s3Client,
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
