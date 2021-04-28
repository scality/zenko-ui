// @flow

import type { SecretsAction } from '../../types/actions';
import type { SecretsState } from '../../types/state';
import { initialSecretsState } from './initialConstants';

export default function secrets(state: SecretsState = initialSecretsState, action: SecretsAction): SecretsState{
    switch (action.type) {
    case 'ADD_ACCOUNT_SECRET':
        return {
            ...state,
            accountKey: {
                accountName: action.accountName,
                accessKey: action.accessKey,
                secretKey: action.secretKey,
            },
        };
    case 'DELETE_ACCOUNT_SECRET':
        return {
            ...state,
            accountKey: null,
        };
    default:
        return state;
    }
}
