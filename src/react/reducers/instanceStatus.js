// @flow
import type { InstanceStatusAction } from '../../types/actions';
import type { InstanceStatusState } from '../../types/state';
import { initialInstanceStatus } from './initialConstants';

export default function(state: InstanceStatusState = initialInstanceStatus, action: InstanceStatusAction) {
    switch (action.type) {
    case 'INSTANCE_STATUS':
        return {
            ...state,
            latest: action.status || initialInstanceStatus.latest,
        };
    default:
        return state;
    }
}
