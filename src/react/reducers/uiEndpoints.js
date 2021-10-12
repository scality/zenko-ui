
// @flow

import type { EndpointsUIAction } from '../../types/actions';
import type { EndpointsUIState } from '../../types/state';
import { initialEndpointsUIState } from './initialConstants';

export default function uiEndpoints(state: EndpointsUIState = initialEndpointsUIState, action: EndpointsUIAction): EndpointsUIState {
    switch (action.type) {
    case 'OPEN_ENDPOINT_DELETE_DIALOG':
        return {
            ...state,
            showDelete: action.hostname,
        };
    case 'CLOSE_ENDPOINT_DELETE_DIALOG':
        return {
            ...state,
            showDelete: '',
        };
    default:
        return state;
    }
}
