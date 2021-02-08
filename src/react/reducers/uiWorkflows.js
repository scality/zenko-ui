// @flow

import { LOCATION_CHANGE } from 'connected-react-router';
import type { WorkflowUIAction } from '../../types/actions';
import type { WorkflowsUIState } from '../../types/state';
import { initialWorkflowsUIState } from './initialConstants';

export default function uiWorkflows(state: WorkflowsUIState = initialWorkflowsUIState, action: WorkflowUIAction) {
    switch (action.type) {
    case 'OPEN_WORKFLOW_EDIT_NOTIFICATION':
        return {
            ...state,
            showEditWorkflowNotification: true,
        };
    case LOCATION_CHANGE:
    case 'CLOSE_WORKFLOW_EDIT_NOTIFICATION':
        return {
            ...state,
            showEditWorkflowNotification: false,
        };
    default:
        return state;
    }
}
