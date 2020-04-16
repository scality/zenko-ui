import { initialAuthState } from './initialConstants';

export default function auth(state = initialAuthState, action) {
    switch (action.type) {
    case 'LOG_IN':
        return {
            ...state,
            apiClient: action.apiClient,
        };
    default:
        return state;
    }
}
