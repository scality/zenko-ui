// @flow
import type {
    CloseWorkflowEditNotificationAction,
    OpenWorkflowEditNotificationAction,
} from '../../types/actions';

export function openWorkflowEditNotification(): OpenWorkflowEditNotificationAction {
    return {
        type: 'OPEN_WORKFLOW_EDIT_NOTIFICATION',
    };
}

export function closeWorkflowEditNotification(): CloseWorkflowEditNotificationAction {
    return {
        type: 'CLOSE_WORKFLOW_EDIT_NOTIFICATION',
    };
}
