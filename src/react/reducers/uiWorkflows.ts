import { WorkflowUIAction } from '../../types/actions';
import { WorkflowsUIState } from '../../types/state';
import { initialWorkflowsUIState } from './initialConstants';
export default function uiWorkflows(
  state: WorkflowsUIState = initialWorkflowsUIState,
  action: WorkflowUIAction,
) {
  switch (action.type) {
    case 'OPEN_WORKFLOW_EDIT_NOTIFICATION':
      return { ...state, showEditWorkflowNotification: true };

    case 'CLOSE_WORKFLOW_EDIT_NOTIFICATION':
      return { ...state, showEditWorkflowNotification: false };

    //@ts-expect-error fix this when you are working on it
    case 'OPEN_WORKFLOW_DELETE_MODAL':
      return { ...state, showWorkflowDeleteModal: true };

    //@ts-expect-error fix this when you are working on it
    case 'CLOSE_WORKFLOW_DELETE_MODAL':
      return { ...state, showWorkflowDeleteModal: false };

    default:
      return state;
  }
}
