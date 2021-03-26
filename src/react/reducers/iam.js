// @flow
import type { IAMAction } from '../../types/actions';
import type { IAMState } from '../../types/state';
import { initialIAMState } from './initialConstants';

export default function(state: IAMState = initialIAMState, action: IAMAction): IAMState {
    switch (action.type) {
    case 'SET_IAM_CLIENT':
        return {
            ...state,
            iamClient: action.iamClient,
        };
    default:
        return state;
    }
}
