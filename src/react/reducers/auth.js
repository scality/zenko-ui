import { initialAuthState } from './initialConstants';

export default function auth(state = initialAuthState, action) {
    switch (action.type) {
    case 'INIT_CLIENTS':
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
    case 'SET_APP_CONFIG':
        return {
            ...state,
            config: action.config,
        };
    case 'CONFIG_AUTH_FAILURE':
        return {
            ...state,
            configFailure: true,
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
