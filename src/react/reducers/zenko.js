// @flow

import type { ZenkoAction } from '../../types/actions';
import type { ZenkoState } from '../../types/state';
import { initialZenkoState } from './initialConstants';

export default function(state: ZenkoState = initialZenkoState, action: ZenkoAction): ZenkoState {
    switch (action.type) {
    case 'SET_ZENKO_CLIENT':
        return {
            ...state,
            zenkoClient: action.zenkoClient,
        };
    default:
        return state;
    }
}
