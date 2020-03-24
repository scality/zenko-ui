import { initialInstanceStatus } from './initialConstants';

export default function(state = initialInstanceStatus, action) {
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
