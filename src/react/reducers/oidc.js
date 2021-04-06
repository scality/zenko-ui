// @flow
import type { OIDCAction } from '../../types/actions';
import type { OIDCState } from '../../types/state';

import { initialNetworkActivityState } from './initialConstants';

export default function oidc(state: OIDCState=initialNetworkActivityState, action: OIDCAction) {
    switch (action.type) {
    case 'ADD_OIDC_USER':
        return {
            ...state,
            user: action.user,
        };
    default:
        return state;
    }
}
