// @flow
import type { AuthAction } from '../../types/actions';
import type { AuthState } from '../../types/state';
import { initialAuthState } from './initialConstants';

export default function auth(state: AuthState = initialAuthState, action: AuthAction) {
    switch (action.type) {
    case 'SET_STS_CLIENT':
        return {
            ...state,
            stsClient: action.stsClient,
        };
    case 'SET_OIDC_LOGOUT':
        return {
            ...state,
            oidcLogout: action.logout,
        };
    case 'SET_MANAGEMENT_CLIENT':
        return {
            ...state,
            managementClient: action.managementClient,
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
    case 'LOAD_CONFIG_SUCCESS':
        return {
            ...state,
            isConfigLoaded: true,
        };
    case 'LOAD_CLIENTS_SUCCESS':
        return {
            ...state,
            isClientsLoaded: true,
        };
    case 'SELECT_ACCOUNT':
        return {
            ...state,
            selectedAccount: action.account,
        };
    default:
        return state;
    }
}
